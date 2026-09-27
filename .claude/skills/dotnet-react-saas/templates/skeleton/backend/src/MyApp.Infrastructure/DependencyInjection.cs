using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Services;
using MyApp.Domain.Identity;
using MyApp.Infrastructure.Audit;
using MyApp.Infrastructure.BackgroundJobs;
using MyApp.Infrastructure.Billing;
using MyApp.Infrastructure.Email;
using MyApp.Infrastructure.Features;
using MyApp.Infrastructure.Files;
using MyApp.Infrastructure.Identity;
using MyApp.Infrastructure.Options;
using MyApp.Infrastructure.Persistence;
using MyApp.Infrastructure.Persistence.Interceptors;
using MyApp.Infrastructure.Security;
using MyApp.Infrastructure.Seeding;
using MyApp.Infrastructure.Tenancy;

namespace MyApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration,
        bool runBackgroundJobs = true)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.Section));
        services.Configure<AppUrlOptions>(configuration.GetSection(AppUrlOptions.Section));
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.Section));
        services.Configure<SeedOptions>(configuration.GetSection(SeedOptions.Section));
        services.Configure<SecurityOptions>(configuration.GetSection(SecurityOptions.Section));

        services.AddSingleton(TimeProvider.System);
        services.AddHttpContextAccessor();

        AddPersistence(services, configuration);
        AddCaching(services, configuration);
        AddIdentity(services);

        services.AddScoped<IFeatureService, FeatureService>();
        services.AddScoped<IAuditWriter, AuditWriter>();
        services.AddScoped<IEmailOutbox, EmailOutbox>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddSingleton<IInvitationFileParser, InvitationFileParser>();
        services.AddSingleton<IBillingProvider, ManualBillingProvider>();
        services.AddSingleton<ISecureTokenGenerator, SecureTokenGenerator>();
        services.AddSingleton<IAppUrls, AppUrls>();
        services.AddScoped<DatabaseSeeder>();

        services.AddHttpClient<IPasswordBreachChecker, PwnedPasswordsChecker>(client =>
        {
            client.BaseAddress = new Uri("https://api.pwnedpasswords.com/");
            client.Timeout = TimeSpan.FromSeconds(3);
            client.DefaultRequestHeaders.Add("Add-Padding", "true");
            client.DefaultRequestHeaders.UserAgent.ParseAdd("MyApp/1.0");
        });

        if (runBackgroundJobs)
        {
            services.AddHostedService<EmailOutboxWorker>();
            services.AddHostedService<InvitationExpiryWorker>();
        }

        return services;
    }

    private static void AddPersistence(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("ConnectionStrings:Postgres is not configured.");

        services.AddScoped<ITenantContext, TenantContext>();
        services.AddScoped<TenantConnectionInterceptor>();
        services.AddScoped<AuditingInterceptor>();

        services.AddDbContext<AppDbContext>((sp, options) => options
            .UseNpgsql(connectionString, npgsql => npgsql
                .MigrationsHistoryTable("__ef_migrations_history")
                .CommandTimeout(30))
            .UseSnakeCaseNamingConvention()
            .AddInterceptors(sp.GetRequiredService<TenantConnectionInterceptor>(), sp.GetRequiredService<AuditingInterceptor>()));

        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
    }

    private static void AddCaching(IServiceCollection services, IConfiguration configuration)
    {
        var redis = configuration.GetConnectionString("Redis");
        if (string.IsNullOrWhiteSpace(redis))
        {
            // Single-instance fallback for local development and tests.
            services.AddDistributedMemoryCache();
            services.AddDataProtection().SetApplicationName("MyApp");
            return;
        }

        var multiplexer = ConnectionMultiplexer.Connect(redis);
        services.AddSingleton<IConnectionMultiplexer>(multiplexer);
        services.AddStackExchangeRedisCache(o =>
        {
            o.ConnectionMultiplexerFactory = () => Task.FromResult<IConnectionMultiplexer>(multiplexer);
            o.InstanceName = "myapp:";
        });
        services.AddDataProtection()
            .SetApplicationName("MyApp")
            .PersistKeysToStackExchangeRedis(multiplexer, "myapp:dataprotection-keys");
    }

    private static void AddIdentity(IServiceCollection services)
    {
        services.AddIdentityCore<ApplicationUser>(o =>
            {
                o.User.RequireUniqueEmail = true;
                o.Password.RequiredLength = 12;
                o.Password.RequiredUniqueChars = 5;
                o.Password.RequireDigit = true;
                o.Password.RequireLowercase = true;
                o.Password.RequireUppercase = true;
                o.Password.RequireNonAlphanumeric = true;
                o.Lockout.MaxFailedAccessAttempts = 5;
                o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                o.Lockout.AllowedForNewUsers = true;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders()
            .AddPasswordValidator<BreachedPasswordValidator>()
            .AddPasswordValidator<PasswordHistoryValidator>()
            .AddPasswordValidator<PersonalInfoPasswordValidator>();

        services.Configure<DataProtectionTokenProviderOptions>(o => o.TokenLifespan = TimeSpan.FromHours(1));
        services.Configure<PasswordHasherOptions>(o => o.IterationCount = 600_000);

        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<JwtKeyProvider>();
        services.AddScoped<IAuthSessionService, AuthSessionService>();
        services.AddSingleton<IMfaChallengeService, MfaChallengeService>();
        services.AddScoped<ISessionValidator, SessionValidator>();
    }
}
