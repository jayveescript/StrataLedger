using FluentValidation;
using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Application.Features.Platform;

public sealed record TierDto(SubscriptionTier Tier, string Name, IReadOnlyList<Feature> Features, int? MaxStrataPlans,
    long StorageQuotaMb, int IncludedOwners, int PerOwnerOverageCents, int MonthlyPriceCents);

[RequiresPermission(Permission.PlatformTiersManage)]
public sealed record ListTiersQuery : IQuery<IReadOnlyList<TierDto>>;

public sealed class ListTiersHandler(IRepository<TierDefinition> tiers) : IRequestHandler<ListTiersQuery, IReadOnlyList<TierDto>>
{
    public async Task<Result<IReadOnlyList<TierDto>>> Handle(ListTiersQuery request, CancellationToken cancellationToken) =>
        await tiers.Query()
            .OrderBy(t => t.Tier)
            .Select(t => new TierDto(t.Tier, t.Name, t.Features, t.MaxStrataPlans, t.StorageQuotaMb, t.IncludedOwners,
                t.PerOwnerOverageCents, t.MonthlyPriceCents))
            .ToListAsync(cancellationToken);
}

[RequiresPermission(Permission.PlatformTiersManage)]
public sealed record UpdateTierCommand(SubscriptionTier Tier, string Name, IReadOnlyList<Feature> Features, int? MaxStrataPlans,
    long StorageQuotaMb, int IncludedOwners, int PerOwnerOverageCents, int MonthlyPriceCents) : ICommand<Unit>;

public sealed class UpdateTierValidator : AbstractValidator<UpdateTierCommand>
{
    public UpdateTierValidator()
    {
        RuleFor(x => x.Tier).IsInEnum();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(60);
        RuleForEach(x => x.Features).IsInEnum();
        RuleFor(x => x.MaxStrataPlans).GreaterThan(0).When(x => x.MaxStrataPlans.HasValue);
        RuleFor(x => x.StorageQuotaMb).InclusiveBetween(0, 10_000_000);
        RuleFor(x => x.IncludedOwners).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PerOwnerOverageCents).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MonthlyPriceCents).GreaterThanOrEqualTo(0);
    }
}

public sealed class UpdateTierHandler(IRepository<TierDefinition> tiers, IRepository<Company> companies, IFeatureService features)
    : IRequestHandler<UpdateTierCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateTierCommand request, CancellationToken cancellationToken)
    {
        var tier = await tiers.QueryTracked().FirstOrDefaultAsync(t => t.Tier == request.Tier, cancellationToken);
        if (tier is null)
        {
            return Error.NotFound("Tier");
        }

        tier.Update(request.Name, request.Features, request.MaxStrataPlans, request.StorageQuotaMb, request.IncludedOwners,
            request.PerOwnerOverageCents, request.MonthlyPriceCents);

        var affected = await companies.Query().Where(c => c.Tier == request.Tier).Select(c => c.Id).ToListAsync(cancellationToken);
        foreach (var companyId in affected)
        {
            await features.InvalidateAsync(companyId, cancellationToken);
        }

        return Unit.Value;
    }
}
