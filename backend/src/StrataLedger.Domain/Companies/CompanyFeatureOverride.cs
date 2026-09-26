using StrataLedger.Domain.Common;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Domain.Companies;

/// <summary>Super Admin grant/revoke of a feature for one company, on top of its tier.</summary>
public sealed class CompanyFeatureOverride : Entity
{
    private CompanyFeatureOverride() { }

    internal CompanyFeatureOverride(Guid companyId, Feature feature, bool enabled, DateTimeOffset? expiresAt, string? note)
    {
        CompanyId = companyId;
        Feature = feature;
        Update(enabled, expiresAt, note);
    }

    public Guid CompanyId { get; private set; }
    public Feature Feature { get; private set; }
    public bool Enabled { get; private set; }
    public DateTimeOffset? ExpiresAt { get; private set; }
    public string? Note { get; private set; }

    public bool IsActive(DateTimeOffset now) => ExpiresAt is null || ExpiresAt > now;

    internal void Update(bool enabled, DateTimeOffset? expiresAt, string? note)
    {
        Enabled = enabled;
        ExpiresAt = expiresAt;
        Note = note?.Trim();
    }
}
