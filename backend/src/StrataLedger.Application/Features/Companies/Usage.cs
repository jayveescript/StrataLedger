using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Strata;

namespace StrataLedger.Application.Features.Companies;

public sealed record UsageDto(
    SubscriptionTier Tier, string TierName,
    int StrataPlans, int? MaxStrataPlans,
    long StorageUsedBytes, long StorageQuotaBytes,
    UsagePricing Pricing);

/// <summary>Tier limit checks shared by commands. Returns 402-style errors instead of throwing.</summary>
public sealed class UsageLimits(
    IRepository<Company> companies,
    IRepository<TierDefinition> tiers,
    IRepository<StrataPlan> plans,
    IRepository<Owner> owners,
    IBillingProvider billing)
{
    public async Task<Result<Unit>> EnsureCanAddStrataPlanAsync(Guid companyId, CancellationToken ct)
    {
        var (_, tier) = await LoadAsync(companyId, ct);
        var count = await CountPlansAsync(companyId, ct);
        return tier.MaxStrataPlans is { } max && count >= max
            ? Error.LimitReached("limit.strata_plans",
                $"Your {tier.Name} plan allows {max} strata plans. Upgrade to add more.")
            : Unit.Value;
    }

    public async Task<Result<Unit>> EnsureStorageAvailableAsync(Guid companyId, long additionalBytes, CancellationToken ct)
    {
        var (company, tier) = await LoadAsync(companyId, ct);
        return company.StorageUsedBytes + additionalBytes > tier.StorageQuotaBytes
            ? Error.LimitReached("limit.storage", $"Your {tier.Name} plan storage quota is full.")
            : Unit.Value;
    }

    public async Task<UsageDto> GetUsageAsync(Guid companyId, CancellationToken ct)
    {
        var (company, tier) = await LoadAsync(companyId, ct);
        var planCount = await CountPlansAsync(companyId, ct);
        var ownerCount = await owners.Query().IgnoreQueryFilters()
            .CountAsync(o => o.CompanyId == companyId && !o.IsDeleted, ct);

        return new UsageDto(tier.Tier, tier.Name, planCount, tier.MaxStrataPlans,
            company.StorageUsedBytes, tier.StorageQuotaBytes,
            billing.Calculate(tier.MonthlyPriceCents, tier.IncludedOwners, tier.PerOwnerOverageCents, ownerCount));
    }

    private Task<int> CountPlansAsync(Guid companyId, CancellationToken ct) =>
        plans.Query().IgnoreQueryFilters().CountAsync(p => p.CompanyId == companyId && !p.IsDeleted, ct);

    private async Task<(Company Company, TierDefinition Tier)> LoadAsync(Guid companyId, CancellationToken ct)
    {
        var company = await companies.Query().FirstAsync(c => c.Id == companyId, ct);
        var tier = await tiers.Query().FirstAsync(t => t.Tier == company.Tier, ct);
        return (company, tier);
    }
}

[RequiresPermission(Permission.CompanyUsageRead)]
public sealed record GetCompanyUsageQuery(Guid? CompanyId) : IQuery<UsageDto>;

public sealed class GetCompanyUsageHandler(ICurrentUser currentUser, UsageLimits limits)
    : IRequestHandler<GetCompanyUsageQuery, UsageDto>
{
    public async Task<Result<UsageDto>> Handle(GetCompanyUsageQuery request, CancellationToken cancellationToken) =>
        await currentUser.ResolveCompany(request.CompanyId)
            .BindAsync(async id => Result<UsageDto>.Success(await limits.GetUsageAsync(id, cancellationToken)));
}
