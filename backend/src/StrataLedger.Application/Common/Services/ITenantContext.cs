namespace StrataLedger.Application.Common.Services;

/// <summary>
/// Which tenant the database session is scoped to. Drives the EF global query filter and the Postgres RLS
/// session variable. Platform scope (Super Admin / system jobs) bypasses both.
/// </summary>
public interface ITenantContext
{
    Guid? CompanyId { get; }
    bool IsPlatformScope { get; }

    /// <summary>Scopes the current unit of work to a company (used by anonymous flows such as invitation acceptance).</summary>
    Task EnterCompanyScopeAsync(Guid companyId, CancellationToken cancellationToken = default);

    Task EnterPlatformScopeAsync(CancellationToken cancellationToken = default);
}
