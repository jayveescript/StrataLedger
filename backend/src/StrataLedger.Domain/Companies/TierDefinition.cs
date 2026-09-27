using StrataLedger.Domain.Common;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Domain.Companies;

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
    public int? MaxStrataPlans { get; private set; }

    public long StorageQuotaMb { get; private set; }

    /// <summary>Owners included in the base price; each owner beyond this is billed at the overage rate.</summary>
    public int IncludedOwners { get; private set; }

    public int PerOwnerOverageCents { get; private set; }
    public int MonthlyPriceCents { get; private set; }

    public void Update(string name, IEnumerable<Feature> features, int? maxStrataPlans, long storageQuotaMb,
        int includedOwners, int perOwnerOverageCents, int monthlyPriceCents)
    {
        Name = name.Trim();
        Features = features.Distinct().Order().ToList();
        MaxStrataPlans = maxStrataPlans;
        StorageQuotaMb = storageQuotaMb;
        IncludedOwners = includedOwners;
        PerOwnerOverageCents = perOwnerOverageCents;
        MonthlyPriceCents = monthlyPriceCents;
    }

    public long StorageQuotaBytes => StorageQuotaMb * 1024 * 1024;
}
