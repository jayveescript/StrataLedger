using MyApp.Application.Common.Services;

namespace MyApp.Infrastructure.Billing;

/// <summary>Launch billing: calculate the monthly amount for manual invoicing. Swap for a Stripe provider later.</summary>
public sealed class ManualBillingProvider : IBillingProvider
{
    public UsagePricing Calculate(int monthlyBaseCents, int includedSeats, int perSeatOverageCents, int seatCount)
    {
        var overage = Math.Max(0, seatCount - includedSeats);
        return new UsagePricing(includedSeats, seatCount, overage, perSeatOverageCents, monthlyBaseCents,
            monthlyBaseCents + overage * perSeatOverageCents);
    }
}
