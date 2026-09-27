using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using MyApp.Application.Common.Services;

namespace MyApp.Infrastructure.Persistence;

/// <summary>Used only by <c>dotnet ef</c> to build migrations.</summary>
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=myapp_design", o => o.MigrationsHistoryTable("__ef_migrations_history"))
            .UseSnakeCaseNamingConvention()
            .Options;
        return new AppDbContext(options, new DesignTimeTenant());
    }

    private sealed class DesignTimeTenant : ITenantContext
    {
        public Guid? TenantId => null;
        public bool IsPlatformScope => true;
        public Task EnterTenantScopeAsync(Guid tenantId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnterPlatformScopeAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
