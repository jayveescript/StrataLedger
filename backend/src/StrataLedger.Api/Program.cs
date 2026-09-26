using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using Scalar.AspNetCore;
using Serilog;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application;
using StrataLedger.Infrastructure;
using StrataLedger.Infrastructure.Options;
using StrataLedger.Infrastructure.Seeding;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, logger) => logger
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

builder.WebHost.ConfigureKestrel(o =>
{
    o.AddServerHeader = false;
    o.Limits.MaxRequestBodySize = 1 * 1024 * 1024; // endpoints that accept uploads raise this explicitly
});

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration, runBackgroundJobs: !builder.Configuration.GetValue<bool>("BackgroundJobs:Disabled"))
    .AddApiAuthentication()
    .AddApiRateLimiting(builder.Configuration);

builder.Services
    .AddControllers(o => o.SuppressAsyncSuffixInActionNames = false)
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    });

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddOutputCache();
builder.Services.AddResponseCompression(o => o.EnableForHttps = true);
builder.Services.AddOpenApi();

var frontendOrigin = builder.Configuration.GetSection(AppUrlOptions.Section).Get<AppUrlOptions>()?.FrontendBaseUrl
    ?? "http://localhost:5173";
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(frontendOrigin)
    .WithMethods("GET", "POST", "PUT", "DELETE")
    .WithHeaders("Authorization", "Content-Type", StrataLedger.Api.Controllers.AuthController.CsrfHeader)
    .AllowCredentials()
    .SetPreflightMaxAge(TimeSpan.FromHours(1))));

builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownIPNetworks.Clear();
    o.KnownProxies.Clear();
    o.ForwardLimit = 1;
});

var healthChecks = builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")!, name: "postgres", tags: ["ready"]);
if (builder.Configuration.GetConnectionString("Redis") is { Length: > 0 } redisConnection)
{
    healthChecks.AddRedis(redisConnection, name: "redis", tags: ["ready"]);
}

var app = builder.Build();

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseMiddleware<SecurityHeadersMiddleware>();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseResponseCompression();
app.UseSerilogRequestLogging();
app.UseCors();
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.UseOutputCache();

app.MapControllers();
app.MapHealthChecks("/health/live", new() { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") }).AllowAnonymous();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.MapScalarApiReference().AllowAnonymous();
}

await app.Services.MigrateAndSeedAsync(app.Configuration.GetValue("Database:MigrateOnStartup", true));
await app.RunAsync();

public partial class Program;
