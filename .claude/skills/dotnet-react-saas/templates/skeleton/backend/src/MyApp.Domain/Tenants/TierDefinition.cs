using MyApp.Domain.Common;
using MyApp.Domain.Enums;

namespace MyApp.Domain.Tenants;

/// <summary>Price book entry: which features a tier unlocks and the usage limits that apply.</summary>
public sealed class TierDefinition : AuditableEntity
{
    private TierDefinition() { }

    public TierDefinition(SubscriptionTier tier, string name) : this()
    {
        Tier = tier;
        Name = name;
    }

    public SubscriptionTier Tier { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public List<Feature> Features { get; private set; } = [];

    /// <summary>Null means unlimited.</summary>
    public int? MaxItems { get; private set; }

    public long StorageQuotaMb { get; private set; }

    /// <summary>Members included in the base price; each member beyond this is billed at the overage rate.</summary>
    public int IncludedSeats { get; private set; }

    public int PerSeatOverageCents { get; private set; }
    public int MonthlyPriceCents { get; private set; }

    public void Update(string name, IEnumerable<Feature> features, int? maxItems, long storageQuotaMb,
        int includedSeats, int perSeatOverageCents, int monthlyPriceCents)
    {
        Name = name.Trim();
        Features = features.Distinct().Order().ToList();
        MaxItems = maxItems;
        StorageQuotaMb = storageQuotaMb;
        IncludedSeats = includedSeats;
        PerSeatOverageCents = perSeatOverageCents;
        MonthlyPriceCents = monthlyPriceCents;
    }

    public long StorageQuotaBytes => StorageQuotaMb * 1024 * 1024;
}
