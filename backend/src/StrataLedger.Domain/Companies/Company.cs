using StrataLedger.Domain.Common;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Domain.Companies;

public sealed class Company : AuditableEntity
{
    private Company() { }

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Abn { get; private set; }
    public string ContactName { get; private set; } = string.Empty;
    public string ContactEmail { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public List<AustralianState> States { get; private set; } = [];
    public CompanyStatus Status { get; private set; } = CompanyStatus.Active;
    public SubscriptionTier Tier { get; private set; } = SubscriptionTier.Starter;

    /// <summary>Bumped to invalidate every access token issued for this company (force logout).</summary>
    public int SessionVersion { get; private set; } = 1;

    public long StorageUsedBytes { get; private set; }
    public BrandSettings Branding { get; private set; } = new();

    public List<CompanyFeatureOverride> FeatureOverrides { get; private set; } = [];

    public static Company Create(string name, string slug, string? abn, string contactName, string contactEmail,
        string? phone, IEnumerable<AustralianState> states, SubscriptionTier tier) => new()
    {
        Name = name.Trim(),
        Slug = slug,
        Abn = abn?.Trim(),
        ContactName = contactName.Trim(),
        ContactEmail = contactEmail.Trim().ToLowerInvariant(),
        Phone = phone?.Trim(),
        States = states.Distinct().ToList(),
        Tier = tier,
        Branding = BrandSettings.Default(name.Trim()),
    };

    public void UpdateDetails(string name, string? abn, string contactName, string contactEmail, string? phone,
        IEnumerable<AustralianState> states)
    {
        Name = name.Trim();
        Abn = abn?.Trim();
        ContactName = contactName.Trim();
        ContactEmail = contactEmail.Trim().ToLowerInvariant();
        Phone = phone?.Trim();
        States = states.Distinct().ToList();
    }

    public void ChangeTier(SubscriptionTier tier) => Tier = tier;

    public void ChangeStatus(CompanyStatus status)
    {
        Status = status;
        RevokeAllSessions();
    }

    public void RevokeAllSessions() => SessionVersion++;

    public void UpdateBranding(BrandSettings branding) => Branding = branding;

    public void TrackStorage(long deltaBytes) => StorageUsedBytes = Math.Max(0, StorageUsedBytes + deltaBytes);

    public void SetFeatureOverride(Feature feature, bool enabled, DateTimeOffset? expiresAt, string? note)
    {
        var existing = FeatureOverrides.FirstOrDefault(o => o.Feature == feature);
        if (existing is null)
        {
            FeatureOverrides.Add(new CompanyFeatureOverride(Id, feature, enabled, expiresAt, note));
            return;
        }

        existing.Update(enabled, expiresAt, note);
    }

    public bool RemoveFeatureOverride(Feature feature) =>
        FeatureOverrides.RemoveAll(o => o.Feature == feature) > 0;
}
