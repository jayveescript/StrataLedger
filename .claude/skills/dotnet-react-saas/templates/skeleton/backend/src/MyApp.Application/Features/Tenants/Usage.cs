using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;
using MyApp.Domain.Items;
using MyApp.Domain.Tenants;

namespace MyApp.Application.Features.Tenants;

public sealed record UsageDto(
    SubscriptionTier Tier, string TierName,
    int Items, int? MaxItems,
    long StorageUsedBytes, long StorageQuotaBytes,
    UsagePricing Pricing);

/// <summary>Tier limit checks shared by commands. Returns 402-style errors instead of throwing.</summary>
public sealed class UsageLimits(
    IRepository<Tenant> tenants,
    IRepository<TierDefinition> tiers,
    IRepository<Item> items,
    UserManager<ApplicationUser> users,
    IBillingProvider billing)
{
    public async Task<Result<Unit>> EnsureCanAddItemAsync(Guid tenantId, CancellationToken ct)
    {
        var (_, tier) = await LoadAsync(tenantId, ct);
        var count = await CountItemsAsync(tenantId, ct);
        return tier.MaxItems is { } max && count >= max
            ? Error.LimitReached("limit.items", $"Your {tier.Name} plan allows {max} items. Upgrade to add more.")
            : Unit.Value;
    }

    public async Task<Result<Unit>> EnsureStorageAvailableAsync(Guid tenantId, long additionalBytes, CancellationToken ct)
    {
        var (tenant, tier) = await LoadAsync(tenantId, ct);
        return tenant.StorageUsedBytes + additionalBytes > tier.StorageQuotaBytes
            ? Error.LimitReached("limit.storage", $"Your {tier.Name} plan storage quota is full.")
            : Unit.Value;
    }

    public async Task<UsageDto> GetUsageAsync(Guid tenantId, CancellationToken ct)
    {
        var (tenant, tier) = await LoadAsync(tenantId, ct);
        var itemCount = await CountItemsAsync(tenantId, ct);
        var seats = await users.Users.CountAsync(u => u.TenantId == tenantId && u.IsActive, ct);

        return new UsageDto(tier.Tier, tier.Name, itemCount, tier.MaxItems, tenant.StorageUsedBytes, tier.StorageQuotaBytes,
            billing.Calculate(tier.MonthlyPriceCents, tier.IncludedSeats, tier.PerSeatOverageCents, seats));
    }

    private Task<int> CountItemsAsync(Guid tenantId, CancellationToken ct) =>
        items.Query().IgnoreQueryFilters().CountAsync(i => i.TenantId == tenantId && !i.IsDeleted, ct);

    private async Task<(Tenant Tenant, TierDefinition Tier)> LoadAsync(Guid tenantId, CancellationToken ct)
    {
        var tenant = await tenants.Query().FirstAsync(c => c.Id == tenantId, ct);
        var tier = await tiers.Query().FirstAsync(t => t.Tier == tenant.Tier, ct);
        return (tenant, tier);
    }
}

[RequiresPermission(Permission.TenantUsageRead)]
public sealed record GetTenantUsageQuery(Guid? TenantId) : IQuery<UsageDto>;

public sealed class GetTenantUsageHandler(ICurrentUser currentUser, UsageLimits limits)
    : IRequestHandler<GetTenantUsageQuery, UsageDto>
{
    public async Task<Result<UsageDto>> Handle(GetTenantUsageQuery request, CancellationToken cancellationToken) =>
        await currentUser.ResolveTenant(request.TenantId)
            .BindAsync(async id => Result<UsageDto>.Success(await limits.GetUsageAsync(id, cancellationToken)));
}
