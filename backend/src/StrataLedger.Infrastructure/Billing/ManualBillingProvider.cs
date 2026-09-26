using StrataLedger.Application.Common.Services;

namespace StrataLedger.Infrastructure.Billing;

/// <summary>Launch billing: calculate the monthly amount for manual invoicing. Swap for a Stripe provider later.</summary>
public sealed class ManualBillingProvider : IBillingProvider
{
    public UsagePricing Calculate(int monthlyBaseCents, int includedOwners, int perOwnerOverageCents, int ownerCount)
    {
        var overage = Math.Max(0, ownerCount - includedOwners);
        return new UsagePricing(includedOwners, ownerCount, overage, perOwnerOverageCents, monthlyBaseCents,
            monthlyBaseCents + overage * perOwnerOverageCents);
    }
}
