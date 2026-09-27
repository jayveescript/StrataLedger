using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Npgsql;
using Testcontainers.PostgreSql;

namespace MyApp.IntegrationTests.Infrastructure;

/// <summary>
/// Boots the real API against a throwaway Postgres database. Uses <c>MYAPP_TEST_PG_ADMIN</c> when set (e.g. a
/// local server), otherwise starts a Testcontainers Postgres. The API connects as a NON-superuser role so row-level
/// security is genuinely enforced, exactly as in production.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const string AppRole = "sl_test_app";
    private const string AppPassword = "sl_test_app_pw";

    private PostgreSqlContainer? _container;
    private string _adminConnection = string.Empty;
    private readonly string _database = $"sl_test_{Guid.NewGuid():N}";

    public string AppConnectionString { get; private set; } = string.Empty;
    public bool RateLimitingEnabled { get; init; }

    public async Task InitializeAsync()
    {
        _adminConnection = Environment.GetEnvironmentVariable("MYAPP_TEST_PG_ADMIN") ?? await StartContainerAsync();

        await using (var admin = new NpgsqlConnection(_adminConnection))
        {
            await admin.OpenAsync();
            // Fixtures start in parallel; tolerate another one creating the role first.
            await Execute(admin, $"""
                DO $$ BEGIN
                  CREATE ROLE {AppRole} LOGIN PASSWORD '{AppPassword}' NOSUPERUSER NOBYPASSRLS;
                EXCEPTION WHEN duplicate_object OR unique_violation THEN NULL;
                END $$;
                """);
            await Execute(admin, $"CREATE DATABASE {_database} OWNER {AppRole}");
        }

        var builder = new NpgsqlConnectionStringBuilder(_adminConnection)
        {
            Database = _database,
            Username = AppRole,
            Password = AppPassword,
        };
        AppConnectionString = builder.ConnectionString;

        _ = Server; // boots the host: migrations + seed run now
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        // UseSetting applies before Program's builder code reads configuration.
        var settings = new Dictionary<string, string>
        {
            ["ConnectionStrings:Postgres"] = AppConnectionString,
            ["ConnectionStrings:Redis"] = string.Empty,
            ["BackgroundJobs:Disabled"] = "true",
            ["RateLimiting:Disabled"] = RateLimitingEnabled ? "false" : "true",
            ["Security:BreachedPasswordCheck"] = "false",
            ["Seed:SuperAdminEmail"] = TestData.SuperAdminEmail,
            ["Seed:SuperAdminPassword"] = TestData.Password,
            ["Seed:DemoData"] = "false",
            ["Jwt:DevKeyPath"] = Path.Combine(Path.GetTempPath(), "myapp-tests", "jwt.pem"),
            ["Serilog:MinimumLevel:Default"] = "Warning",
        };
        foreach (var (key, value) in settings)
        {
            builder.UseSetting(key, value);
        }
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        NpgsqlConnection.ClearAllPools();
        await using (var admin = new NpgsqlConnection(_adminConnection))
        {
            await admin.OpenAsync();
            await Execute(admin, $"DROP DATABASE IF EXISTS {_database} WITH (FORCE)");
        }

        if (_container is not null)
        {
            await _container.DisposeAsync();
        }
    }

    private async Task<string> StartContainerAsync()
    {
        _container = new PostgreSqlBuilder("postgres:16-alpine").Build();
        await _container.StartAsync();
        return _container.GetConnectionString();
    }

    private static async Task Execute(NpgsqlConnection connection, string sql)
    {
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}

/// <summary>Separate host with rate limiting switched on.</summary>
public sealed class RateLimitedApiFactory : IAsyncLifetime
{
    public ApiFactory Factory { get; } = new() { RateLimitingEnabled = true };

    public Task InitializeAsync() => Factory.InitializeAsync();

    public Task DisposeAsync() => Factory.DisposeAsync();
}
