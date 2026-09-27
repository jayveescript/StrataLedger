using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using MyApp.Application.Common.Services;
using MyApp.Infrastructure.Persistence;
using MyApp.Infrastructure.Persistence.Interceptors;

namespace MyApp.Infrastructure.Tenancy;

/// <summary>
/// Defaults to the signed-in user's tenant (Super Admin = platform scope). Anonymous flows and background jobs switch
/// scope explicitly; switching also re-applies the RLS session settings on an already-open connection.
/// </summary>
public sealed class TenantContext(ICurrentUser currentUser, IServiceProvider services) : ITenantContext
{
    private Guid? _tenantOverride;
    private bool? _platformOverride;

    public Guid? TenantId => _tenantOverride ?? currentUser.TenantId;

    public bool IsPlatformScope => _platformOverride ?? currentUser.IsSuperAdmin;

    public Task EnterTenantScopeAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        _tenantOverride = tenantId;
        _platformOverride = false;
        return ApplyToOpenConnectionAsync(cancellationToken);
    }

    public Task EnterPlatformScopeAsync(CancellationToken cancellationToken = default)
    {
        _platformOverride = true;
        return ApplyToOpenConnectionAsync(cancellationToken);
    }

    private async Task ApplyToOpenConnectionAsync(CancellationToken ct)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var connection = db.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            return;
        }

        await using var command = TenantSessionSql.CreateCommand(connection, TenantId, IsPlatformScope);
        command.Transaction = db.Database.CurrentTransaction?.GetDbTransaction();
        await command.ExecuteNonQueryAsync(ct);
    }
}
