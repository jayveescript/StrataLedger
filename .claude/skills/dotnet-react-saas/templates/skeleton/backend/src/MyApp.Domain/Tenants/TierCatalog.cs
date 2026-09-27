using MyApp.Domain.Enums;
using static MyApp.Domain.Enums.Feature;

namespace MyApp.Domain.Tenants;

/// <summary>Launch price book used to seed <see cref="TierDefinition"/> rows. Super Admin edits them afterwards.</summary>
public static class TierCatalog
{
    public sealed record TierSeed(SubscriptionTier Tier, string Name, Feature[] Features, int? MaxItems,
        long StorageQuotaMb, int IncludedSeats, int PerSeatOverageCents, int MonthlyPriceCents);

    private static readonly Feature[] StarterFeatures = [Feature.Items, MemberPortal, MemberInvitations];

    private static readonly Feature[] ProfessionalFeatures = [.. StarterFeatures, CustomBranding, AuditLog, Documents, Reports];

    public static readonly IReadOnlyList<TierSeed> Defaults =
    [
        new(SubscriptionTier.Starter, "Starter", StarterFeatures, 50, 1_024, 10, 1_500, 4_900),
        new(SubscriptionTier.Professional, "Professional", ProfessionalFeatures, 1_000, 20_480, 50, 1_200, 19_900),
        new(SubscriptionTier.Enterprise, "Enterprise", Enum.GetValues<Feature>(), null, 204_800, 500, 900, 99_900),
    ];
}
