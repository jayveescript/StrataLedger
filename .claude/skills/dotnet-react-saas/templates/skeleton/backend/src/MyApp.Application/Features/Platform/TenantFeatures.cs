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

public sealed record FeatureAccessDto(Feature Feature, bool IncludedInTier, bool? OverrideEnabled, DateTimeOffset? OverrideExpiresAt,
    string? OverrideNote, bool Effective);

/// <summary>Feature matrix for one tenant: what the tier gives, what Super Admin overrode, and the net result.</summary>
[RequiresPermission(Permission.PlatformFeaturesManage)]
public sealed record GetTenantFeaturesQuery(Guid TenantId) : IQuery<IReadOnlyList<FeatureAccessDto>>;

public sealed class GetTenantFeaturesHandler(
    IRepository<Tenant> tenants,
    IRepository<TierDefinition> tiers,
    IFeatureService features) : IRequestHandler<GetTenantFeaturesQuery, IReadOnlyList<FeatureAccessDto>>
{
    public async Task<Result<IReadOnlyList<FeatureAccessDto>>> Handle(GetTenantFeaturesQuery request, CancellationToken cancellationToken)
    {
        var tenant = await tenants.Query().Include(c => c.FeatureOverrides)
            .FirstOrDefaultAsync(c => c.Id == request.TenantId, cancellationToken);
        if (tenant is null)
        {
            return Error.NotFound("Tenant");
        }

        var tierFeatures = (await tiers.Query().Where(t => t.Tier == tenant.Tier).Select(t => t.Features).FirstAsync(cancellationToken)).ToHashSet();
        var effective = await features.GetEnabledFeaturesAsync(tenant.Id, cancellationToken);
        var overrides = tenant.FeatureOverrides.ToDictionary(o => o.Feature);

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
public sealed record SetTenantFeatureCommand(Guid TenantId, Feature Feature, bool Enabled, DateTimeOffset? ExpiresAt, string? Note)
    : ICommand<Unit>;

public sealed class SetTenantFeatureValidator : AbstractValidator<SetTenantFeatureCommand>
{
    public SetTenantFeatureValidator()
    {
        RuleFor(x => x.Feature).IsInEnum();
        RuleFor(x => x.Note).MaximumLength(500);
    }
}

public sealed class SetTenantFeatureHandler(IRepository<Tenant> tenants, IFeatureService features)
    : IRequestHandler<SetTenantFeatureCommand, Unit>
{
    public async Task<Result<Unit>> Handle(SetTenantFeatureCommand request, CancellationToken cancellationToken)
    {
        var tenant = await tenants.QueryTracked().Include(c => c.FeatureOverrides)
            .FirstOrDefaultAsync(c => c.Id == request.TenantId, cancellationToken);
        if (tenant is null)
        {
            return Error.NotFound("Tenant");
        }

        tenant.SetFeatureOverride(request.Feature, request.Enabled, request.ExpiresAt, request.Note);
        await features.InvalidateAsync(tenant.Id, cancellationToken);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.PlatformFeaturesManage)]
public sealed record ClearTenantFeatureCommand(Guid TenantId, Feature Feature) : ICommand<Unit>;

public sealed class ClearTenantFeatureHandler(IRepository<Tenant> tenants, IFeatureService features)
    : IRequestHandler<ClearTenantFeatureCommand, Unit>
{
    public async Task<Result<Unit>> Handle(ClearTenantFeatureCommand request, CancellationToken cancellationToken)
    {
        var tenant = await tenants.QueryTracked().Include(c => c.FeatureOverrides)
            .FirstOrDefaultAsync(c => c.Id == request.TenantId, cancellationToken);
        if (tenant is null)
        {
            return Error.NotFound("Tenant");
        }

        tenant.RemoveFeatureOverride(request.Feature);
        await features.InvalidateAsync(tenant.Id, cancellationToken);
        return Unit.Value;
    }
}
