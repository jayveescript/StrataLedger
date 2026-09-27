using FluentValidation;
using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;

namespace MyApp.Application.Features.Platform;

public sealed record TierDto(SubscriptionTier Tier, string Name, IReadOnlyList<Feature> Features, int? MaxItems,
    long StorageQuotaMb, int IncludedSeats, int PerSeatOverageCents, int MonthlyPriceCents);

[RequiresPermission(Permission.PlatformTiersManage)]
public sealed record ListTiersQuery : IQuery<IReadOnlyList<TierDto>>;

public sealed class ListTiersHandler(IRepository<TierDefinition> tiers) : IRequestHandler<ListTiersQuery, IReadOnlyList<TierDto>>
{
    public async Task<Result<IReadOnlyList<TierDto>>> Handle(ListTiersQuery request, CancellationToken cancellationToken) =>
        await tiers.Query()
            .OrderBy(t => t.Tier)
            .Select(t => new TierDto(t.Tier, t.Name, t.Features, t.MaxItems, t.StorageQuotaMb, t.IncludedSeats,
                t.PerSeatOverageCents, t.MonthlyPriceCents))
            .ToListAsync(cancellationToken);
}

[RequiresPermission(Permission.PlatformTiersManage)]
public sealed record UpdateTierCommand(SubscriptionTier Tier, string Name, IReadOnlyList<Feature> Features, int? MaxItems,
    long StorageQuotaMb, int IncludedSeats, int PerSeatOverageCents, int MonthlyPriceCents) : ICommand<Unit>;

public sealed class UpdateTierValidator : AbstractValidator<UpdateTierCommand>
{
    public UpdateTierValidator()
    {
        RuleFor(x => x.Tier).IsInEnum();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(60);
        RuleForEach(x => x.Features).IsInEnum();
        RuleFor(x => x.MaxItems).GreaterThan(0).When(x => x.MaxItems.HasValue);
        RuleFor(x => x.StorageQuotaMb).InclusiveBetween(0, 10_000_000);
        RuleFor(x => x.IncludedSeats).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PerSeatOverageCents).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MonthlyPriceCents).GreaterThanOrEqualTo(0);
    }
}

public sealed class UpdateTierHandler(IRepository<TierDefinition> tiers, IRepository<Tenant> tenants, IFeatureService features)
    : IRequestHandler<UpdateTierCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateTierCommand request, CancellationToken cancellationToken)
    {
        var tier = await tiers.QueryTracked().FirstOrDefaultAsync(t => t.Tier == request.Tier, cancellationToken);
        if (tier is null)
        {
            return Error.NotFound("Tier");
        }

        tier.Update(request.Name, request.Features, request.MaxItems, request.StorageQuotaMb, request.IncludedSeats,
            request.PerSeatOverageCents, request.MonthlyPriceCents);

        var affected = await tenants.Query().Where(c => c.Tier == request.Tier).Select(c => c.Id).ToListAsync(cancellationToken);
        foreach (var tenantId in affected)
        {
            await features.InvalidateAsync(tenantId, cancellationToken);
        }

        return Unit.Value;
    }
}
