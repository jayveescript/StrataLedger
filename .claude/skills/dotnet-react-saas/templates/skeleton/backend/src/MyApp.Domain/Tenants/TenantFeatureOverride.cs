using MyApp.Domain.Common;
using MyApp.Domain.Enums;

namespace MyApp.Domain.Tenants;

/// <summary>Super Admin grant/revoke of a feature for one tenant, on top of its tier.</summary>
public sealed class TenantFeatureOverride : Entity
{
    private TenantFeatureOverride() { }

    internal TenantFeatureOverride(Guid tenantId, Feature feature, bool enabled, DateTimeOffset? expiresAt, string? note)
    {
        TenantId = tenantId;
        Feature = feature;
        Update(enabled, expiresAt, note);
    }

    public Guid TenantId { get; private set; }
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
