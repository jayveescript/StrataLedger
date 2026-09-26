using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using StrataLedger.Application.Common.Services;
using StrataLedger.Infrastructure.Persistence;
using StrataLedger.Infrastructure.Persistence.Interceptors;

namespace StrataLedger.Infrastructure.Tenancy;

/// <summary>
/// Defaults to the signed-in user's company (Super Admin = platform scope). Anonymous flows and background jobs switch
/// scope explicitly; switching also re-applies the RLS session settings on an already-open connection.
/// </summary>
public sealed class TenantContext(ICurrentUser currentUser, IServiceProvider services) : ITenantContext
{
    private Guid? _companyOverride;
    private bool? _platformOverride;

    public Guid? CompanyId => _companyOverride ?? currentUser.CompanyId;

    public bool IsPlatformScope => _platformOverride ?? currentUser.IsSuperAdmin;

    public Task EnterCompanyScopeAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        _companyOverride = companyId;
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

        await using var command = TenantSessionSql.CreateCommand(connection, CompanyId, IsPlatformScope);
        command.Transaction = db.Database.CurrentTransaction?.GetDbTransaction();
        await command.ExecuteNonQueryAsync(ct);
    }
}
