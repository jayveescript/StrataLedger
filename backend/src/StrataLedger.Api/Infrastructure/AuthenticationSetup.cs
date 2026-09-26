using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using StrataLedger.Api.Authorization;
using StrataLedger.Application.Common.Services;
using StrataLedger.Infrastructure.Identity;
using StrataLedger.Infrastructure.Options;

namespace StrataLedger.Api.Infrastructure;

public static class AuthenticationSetup
{
    public static IServiceCollection AddApiAuthentication(this IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<JwtKeyProvider, IOptions<JwtOptions>>((bearer, keys, jwt) =>
            {
                bearer.MapInboundClaims = false;
                bearer.RequireHttpsMetadata = true;
                bearer.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = jwt.Value.Issuer,
                    ValidAudience = jwt.Value.Audience,
                    IssuerSigningKey = keys.SigningKey,
                    ValidAlgorithms = [SecurityAlgorithms.RsaSha256],
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    RequireExpirationTime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = AppClaims.Subject,
                    RoleClaimType = AppClaims.Role,
                };
                bearer.Events = new JwtBearerEvents { OnTokenValidated = ValidateSessionAsync };
            });

        services.AddSingleton<IAuthorizationPolicyProvider, DynamicPolicyProvider>();
        services.AddScoped<IAuthorizationHandler, PermissionHandler>();
        services.AddScoped<IAuthorizationHandler, FeatureHandler>();
        services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationMiddlewareResultHandler, ProblemAuthorizationResultHandler>();
        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

        return services;
    }

    /// <summary>Rejects signature-valid tokens whose session was revoked (stamp rotated, company force-logged-out or suspended).</summary>
    private static async Task ValidateSessionAsync(TokenValidatedContext context)
    {
        var principal = context.Principal!;
        var valid = Guid.TryParse(principal.FindFirst(AppClaims.Subject)?.Value, out var userId)
            && principal.FindFirst(AppClaims.SecurityStamp)?.Value is { } stamp
            && int.TryParse(principal.FindFirst(AppClaims.CompanySessionVersion)?.Value, out var companyVersion)
            && await context.HttpContext.RequestServices.GetRequiredService<ISessionValidator>().IsValidAsync(
                userId, stamp,
                Guid.TryParse(principal.FindFirst(AppClaims.CompanyId)?.Value, out var companyId) ? companyId : null,
                companyVersion, context.HttpContext.RequestAborted);

        if (!valid)
        {
            context.Fail("Session has been revoked.");
        }
    }
}
