using StrataLedger.Domain.Enums;
using static StrataLedger.Domain.Enums.Feature;

namespace StrataLedger.Domain.Companies;

/// <summary>Launch price book used to seed <see cref="TierDefinition"/> rows. Super Admin edits them afterwards.</summary>
public static class TierCatalog
{
    public sealed record TierSeed(SubscriptionTier Tier, string Name, Feature[] Features, int? MaxStrataPlans,
        long StorageQuotaMb, int IncludedOwners, int PerOwnerOverageCents, int MonthlyPriceCents);

    private static readonly Feature[] StarterFeatures = [StrataPlans, OwnerPortal, OwnerInvitations];

    private static readonly Feature[] ProfessionalFeatures =
        [.. StarterFeatures, CustomBranding, AuditLog, Documents, Levies, Expenses, Suppliers, Reports];

    public static readonly IReadOnlyList<TierSeed> Defaults =
    [
        new(SubscriptionTier.Starter, "Starter", StarterFeatures, 5, 1_024, 100, 150, 9_900),
        new(SubscriptionTier.Professional, "Professional", ProfessionalFeatures, 50, 20_480, 1_000, 100, 49_900),
        new(SubscriptionTier.Enterprise, "Enterprise", Enum.GetValues<Feature>(), null, 204_800, 10_000, 50, 199_900),
    ];
}
