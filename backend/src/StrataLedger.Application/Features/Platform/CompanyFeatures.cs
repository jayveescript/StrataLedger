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

public sealed record FeatureAccessDto(Feature Feature, bool IncludedInTier, bool? OverrideEnabled, DateTimeOffset? OverrideExpiresAt,
    string? OverrideNote, bool Effective);

/// <summary>Feature matrix for one company: what the tier gives, what Super Admin overrode, and the net result.</summary>
[RequiresPermission(Permission.PlatformFeaturesManage)]
public sealed record GetCompanyFeaturesQuery(Guid CompanyId) : IQuery<IReadOnlyList<FeatureAccessDto>>;

public sealed class GetCompanyFeaturesHandler(
    IRepository<Company> companies,
    IRepository<TierDefinition> tiers,
    IFeatureService features) : IRequestHandler<GetCompanyFeaturesQuery, IReadOnlyList<FeatureAccessDto>>
{
    public async Task<Result<IReadOnlyList<FeatureAccessDto>>> Handle(GetCompanyFeaturesQuery request, CancellationToken cancellationToken)
    {
        var company = await companies.Query().Include(c => c.FeatureOverrides)
            .FirstOrDefaultAsync(c => c.Id == request.CompanyId, cancellationToken);
        if (company is null)
        {
            return Error.NotFound("Company");
        }

        var tierFeatures = (await tiers.Query().Where(t => t.Tier == company.Tier).Select(t => t.Features).FirstAsync(cancellationToken)).ToHashSet();
        var effective = await features.GetEnabledFeaturesAsync(company.Id, cancellationToken);
        var overrides = company.FeatureOverrides.ToDictionary(o => o.Feature);

        return Enum.GetValues<Feature>()
            .Select(f =>
            {
                var o = overrides.GetValueOrDefault(f);
                return new FeatureAccessDto(f, tierFeatures.Contains(f), o?.Enabled, o?.ExpiresAt, o?.Note, effective.Contains(f));
            })
            .ToList();
    }
}

[RequiresPermission(Permission.PlatformFeaturesManage)]
public sealed record SetCompanyFeatureCommand(Guid CompanyId, Feature Feature, bool Enabled, DateTimeOffset? ExpiresAt, string? Note)
    : ICommand<Unit>;

public sealed class SetCompanyFeatureValidator : AbstractValidator<SetCompanyFeatureCommand>
{
    public SetCompanyFeatureValidator()
    {
        RuleFor(x => x.Feature).IsInEnum();
        RuleFor(x => x.Note).MaximumLength(500);
    }
}

public sealed class SetCompanyFeatureHandler(IRepository<Company> companies, IFeatureService features)
    : IRequestHandler<SetCompanyFeatureCommand, Unit>
{
    public async Task<Result<Unit>> Handle(SetCompanyFeatureCommand request, CancellationToken cancellationToken)
    {
        var company = await companies.QueryTracked().Include(c => c.FeatureOverrides)
            .FirstOrDefaultAsync(c => c.Id == request.CompanyId, cancellationToken);
        if (company is null)
        {
            return Error.NotFound("Company");
        }

        company.SetFeatureOverride(request.Feature, request.Enabled, request.ExpiresAt, request.Note);
        await features.InvalidateAsync(company.Id, cancellationToken);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.PlatformFeaturesManage)]
public sealed record ClearCompanyFeatureCommand(Guid CompanyId, Feature Feature) : ICommand<Unit>;

public sealed class ClearCompanyFeatureHandler(IRepository<Company> companies, IFeatureService features)
    : IRequestHandler<ClearCompanyFeatureCommand, Unit>
{
    public async Task<Result<Unit>> Handle(ClearCompanyFeatureCommand request, CancellationToken cancellationToken)
    {
        var company = await companies.QueryTracked().Include(c => c.FeatureOverrides)
            .FirstOrDefaultAsync(c => c.Id == request.CompanyId, cancellationToken);
        if (company is null)
        {
            return Error.NotFound("Company");
        }

        company.RemoveFeatureOverride(request.Feature);
        await features.InvalidateAsync(company.Id, cancellationToken);
        return Unit.Value;
    }
}
