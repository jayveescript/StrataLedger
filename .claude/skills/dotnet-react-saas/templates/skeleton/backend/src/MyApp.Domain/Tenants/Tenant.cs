using MyApp.Domain.Common;
using MyApp.Domain.Enums;

namespace MyApp.Domain.Tenants;

public sealed class Tenant : AuditableEntity
{
    private Tenant() { }

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? TaxId { get; private set; }
    public string ContactName { get; private set; } = string.Empty;
    public string ContactEmail { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public TenantStatus Status { get; private set; } = TenantStatus.Active;
    public SubscriptionTier Tier { get; private set; } = SubscriptionTier.Starter;

    /// <summary>Bumped to invalidate every access token issued for this tenant (force logout).</summary>
    public int SessionVersion { get; private set; } = 1;

    public long StorageUsedBytes { get; private set; }
    public BrandSettings Branding { get; private set; } = new();

    public List<TenantFeatureOverride> FeatureOverrides { get; private set; } = [];

    public static Tenant Create(string name, string slug, string? taxId, string contactName, string contactEmail,
        string? phone, SubscriptionTier tier) => new()
    {
        Name = name.Trim(),
        Slug = slug,
        TaxId = taxId?.Trim(),
        ContactName = contactName.Trim(),
        ContactEmail = contactEmail.Trim().ToLowerInvariant(),
        Phone = phone?.Trim(),
        Tier = tier,
        Branding = BrandSettings.Default(name.Trim()),
    };

    public void UpdateDetails(string name, string? taxId, string contactName, string contactEmail, string? phone)
    {
        Name = name.Trim();
        TaxId = taxId?.Trim();
        ContactName = contactName.Trim();
        ContactEmail = contactEmail.Trim().ToLowerInvariant();
        Phone = phone?.Trim();
    }

    public void ChangeTier(SubscriptionTier tier) => Tier = tier;

    public void ChangeStatus(TenantStatus status)
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
            FeatureOverrides.Add(new TenantFeatureOverride(Id, feature, enabled, expiresAt, note));
            return;
        }

        existing.Update(enabled, expiresAt, note);
    }

    public bool RemoveFeatureOverride(Feature feature) =>
        FeatureOverrides.RemoveAll(o => o.Feature == feature) > 0;
}
