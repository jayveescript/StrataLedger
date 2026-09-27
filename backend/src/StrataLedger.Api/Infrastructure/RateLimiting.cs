using System.Globalization;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using RedisRateLimiting;
using StackExchange.Redis;

namespace StrataLedger.Api.Infrastructure;

public static class RateLimitPolicies
{
    /// <summary>Login, MFA, password reset, invitation acceptance: per client IP.</summary>
    public const string Auth = "auth";

    /// <summary>Token refresh and logout: per client IP, looser than sign-in.</summary>
    public const string Session = "session";

    /// <summary>Bulk operations such as invitation uploads: per user.</summary>
    public const string Bulk = "bulk";
}

/// <summary>
/// Distributed (Redis) sliding-window limits so throttling holds across API instances; in-memory when Redis is not
/// configured. The store is chosen once at startup, not per request.
/// </summary>
public static class RateLimitingSetup
{
    private sealed record Rule(int PermitLimit, TimeSpan Window);

    private static readonly Rule AuthRule = new(20, TimeSpan.FromMinutes(1));
    private static readonly Rule SessionRule = new(120, TimeSpan.FromMinutes(1));
    private static readonly Rule BulkRule = new(20, TimeSpan.FromMinutes(1));
    private static readonly Rule DefaultRule = new(300, TimeSpan.FromMinutes(1));

    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        var redis = configuration.GetConnectionString("Redis");
        var disabled = configuration.GetValue<bool>("RateLimiting:Disabled");

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = WriteRejectionAsync;

            options.AddPolicy(RateLimitPolicies.Auth, ctx => Partition(ctx, $"auth:{ClientIp(ctx)}", AuthRule, redis, disabled));
            options.AddPolicy(RateLimitPolicies.Session, ctx => Partition(ctx, $"session:{ClientIp(ctx)}", SessionRule, redis, disabled));
            options.AddPolicy(RateLimitPolicies.Bulk, ctx => Partition(ctx, $"bulk:{UserOrIp(ctx)}", BulkRule, redis, disabled));
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                Partition(ctx, $"global:{UserOrIp(ctx)}", DefaultRule, redis, disabled));
        });

        return services;
    }

    private static RateLimitPartition<string> Partition(HttpContext ctx, string key, Rule rule, string? redis, bool disabled) =>
        (disabled, string.IsNullOrWhiteSpace(redis)) switch
        {
            (true, _) => RateLimitPartition.GetNoLimiter(key),
            (false, true) => RateLimitPartition.GetSlidingWindowLimiter(key, _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = rule.PermitLimit,
                Window = rule.Window,
                SegmentsPerWindow = 6,
                QueueLimit = 0,
            }),
            _ => RedisRateLimitPartition.GetSlidingWindowRateLimiter(key, _ => new RedisSlidingWindowRateLimiterOptions
            {
                ConnectionMultiplexerFactory = () => ctx.RequestServices.GetRequiredService<IConnectionMultiplexer>(),
                PermitLimit = rule.PermitLimit,
                Window = rule.Window,
            }),
        };

    private static string ClientIp(HttpContext ctx) => ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static string UserOrIp(HttpContext ctx) =>
        ctx.User.FindFirstValue("sub") is { } sub ? $"u:{sub}" : $"ip:{ClientIp(ctx)}";

    private static async ValueTask WriteRejectionAsync(OnRejectedContext context, CancellationToken ct)
    {
        var response = context.HttpContext.Response;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString(CultureInfo.InvariantCulture);
        }

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Too many requests. Please slow down and try again shortly.",
        };
        problem.Extensions["code"] = "rate_limited";
        await response.WriteAsJsonAsync(problem, (System.Text.Json.JsonSerializerOptions?)null, "application/problem+json", ct);
    }
}
