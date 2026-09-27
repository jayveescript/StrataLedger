namespace MyApp.Application.Common.Services;

/// <summary>
/// Which tenant the database session is scoped to. Drives the EF global query filter and the Postgres RLS
/// session variable. Platform scope (Super Admin / system jobs) bypasses both.
/// </summary>
public interface ITenantContext
{
    Guid? TenantId { get; }
    bool IsPlatformScope { get; }

    /// <summary>Scopes the current unit of work to a tenant (used by anonymous flows such as invitation acceptance).</summary>
    Task EnterTenantScopeAsync(Guid tenantId, CancellationToken cancellationToken = default);

    Task EnterPlatformScopeAsync(CancellationToken cancellationToken = default);
}
