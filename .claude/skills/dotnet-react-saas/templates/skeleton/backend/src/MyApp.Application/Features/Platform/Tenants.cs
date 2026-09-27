using System.Text.RegularExpressions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Models;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Application.Features.Tenants;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;
using MyApp.Domain.Items;

namespace MyApp.Application.Features.Platform;

public sealed record TenantListItem(Guid Id, string Name, string Slug, string? TaxId, SubscriptionTier Tier,
    TenantStatus Status, string ContactEmail, int ItemCount, int UserCount,
    DateTimeOffset CreatedAt);

public sealed record TenantDetail(Guid Id, string Name, string Slug, string? TaxId, string ContactName, string ContactEmail,
    string? Phone, SubscriptionTier Tier, TenantStatus Status,
    DateTimeOffset CreatedAt, BrandingDto Branding, UsageDto Usage);

[RequiresPermission(Permission.PlatformTenantsManage)]
public sealed record ListTenantsQuery(string? Search, TenantStatus? Status, SubscriptionTier? Tier, int Page = 1, int PageSize = 25)
    : PageRequest(Page, PageSize), IQuery<PagedResult<TenantListItem>>;

public sealed class ListTenantsHandler(
    IRepository<Tenant> tenants,
    IRepository<Item> items,
    IRepository<ApplicationUser> users) : IRequestHandler<ListTenantsQuery, PagedResult<TenantListItem>>
{
    public async Task<Result<PagedResult<TenantListItem>>> Handle(ListTenantsQuery request, CancellationToken cancellationToken)
    {
        var term = request.Search?.Trim().ToLower();
        var query = tenants.Query()
            .WhereIf(!string.IsNullOrEmpty(term), c => c.Name.ToLower().Contains(term!) || c.ContactEmail.Contains(term!))
            .WhereIf(request.Status.HasValue, c => c.Status == request.Status)
            .WhereIf(request.Tier.HasValue, c => c.Tier == request.Tier)
            .OrderBy(c => c.Name)
            .Select(c => new TenantListItem(c.Id, c.Name, c.Slug, c.TaxId, c.Tier, c.Status, c.ContactEmail,
                items.Query().IgnoreQueryFilters().Count(p => p.TenantId == c.Id && !p.IsDeleted),
                users.Query().Count(u => u.TenantId == c.Id),
                c.CreatedAt));

        return await query.ToPagedResultAsync(request, cancellationToken);
    }
}

[RequiresPermission(Permission.PlatformTenantsManage)]
public sealed record GetTenantQuery(Guid Id) : IQuery<TenantDetail>;

public sealed class GetTenantHandler(IRepository<Tenant> tenants, UsageLimits limits, IAppUrls urls)
    : IRequestHandler<GetTenantQuery, TenantDetail>
{
    public async Task<Result<TenantDetail>> Handle(GetTenantQuery request, CancellationToken cancellationToken)
    {
        var c = await tenants.Query().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (c is null)
        {
            return Error.NotFound("Tenant");
        }

        var usage = await limits.GetUsageAsync(c.Id, cancellationToken);
        return new TenantDetail(c.Id, c.Name, c.Slug, c.TaxId, c.ContactName, c.ContactEmail, c.Phone, c.Tier,
            c.Status, c.CreatedAt, BrandingDto.From(c.Branding, urls), usage);
    }
}

public abstract record TenantFields(string Name, string? TaxId, string ContactName, string ContactEmail, string? Phone);

public sealed class TenantFieldsValidator : AbstractValidator<TenantFields>
{
    public TenantFieldsValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.TaxId).MaximumLength(30);
        RuleFor(x => x.ContactName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ContactEmail).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Phone).MaximumLength(30);
    }
}

[RequiresPermission(Permission.PlatformTenantsManage)]
public sealed record CreateTenantCommand(string Name, string? TaxId, string ContactName, string ContactEmail, string? Phone, SubscriptionTier Tier)
    : TenantFields(Name, TaxId, ContactName, ContactEmail, Phone), ICommand<Guid>;

public sealed class CreateTenantValidator : AbstractValidator<CreateTenantCommand>
{
    public CreateTenantValidator()
    {
        Include(new TenantFieldsValidator());
        RuleFor(x => x.Tier).IsInEnum();
    }
}

public sealed partial class CreateTenantHandler(IRepository<Tenant> tenants) : IRequestHandler<CreateTenantCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateTenantCommand request, CancellationToken cancellationToken)
    {
        var baseSlug = NonSlugChars().Replace(request.Name.Trim().ToLowerInvariant(), "-").Trim('-');
        var taken = await tenants.Query().Where(c => c.Slug.StartsWith(baseSlug)).Select(c => c.Slug).ToListAsync(cancellationToken);
        var slug = Enumerable.Range(1, taken.Count + 1)
            .Select(n => n == 1 ? baseSlug : $"{baseSlug}-{n}")
            .First(s => !taken.Contains(s));

        var tenant = Tenant.Create(request.Name, slug, request.TaxId, request.ContactName, request.ContactEmail,
            request.Phone, request.Tier);
        tenants.Add(tenant);
        return tenant.Id;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlugChars();
}

[RequiresPermission(Permission.PlatformTenantsManage)]
public sealed record UpdateTenantCommand(Guid Id, string Name, string? TaxId, string ContactName, string ContactEmail,
    string? Phone)
    : TenantFields(Name, TaxId, ContactName, ContactEmail, Phone), ICommand<Unit>;

public sealed class UpdateTenantValidator : AbstractValidator<UpdateTenantCommand>
{
    public UpdateTenantValidator() => Include(new TenantFieldsValidator());
}

public sealed class UpdateTenantHandler(IRepository<Tenant> tenants) : IRequestHandler<UpdateTenantCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateTenantCommand request, CancellationToken cancellationToken)
    {
        var tenant = await tenants.FindAsync(request.Id, cancellationToken);
        if (tenant is null)
        {
            return Error.NotFound("Tenant");
        }

        tenant.UpdateDetails(request.Name, request.TaxId, request.ContactName, request.ContactEmail, request.Phone);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.PlatformTenantsManage)]
public sealed record ChangeTenantTierCommand(Guid Id, SubscriptionTier Tier) : ICommand<Unit>;

public sealed class ChangeTenantTierHandler(IRepository<Tenant> tenants, IFeatureService features)
    : IRequestHandler<ChangeTenantTierCommand, Unit>
{
    public async Task<Result<Unit>> Handle(ChangeTenantTierCommand request, CancellationToken cancellationToken)
    {
        var tenant = await tenants.FindAsync(request.Id, cancellationToken);
        if (tenant is null)
        {
            return Error.NotFound("Tenant");
        }

        tenant.ChangeTier(request.Tier);
        await features.InvalidateAsync(tenant.Id, cancellationToken);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.PlatformTenantsManage)]
public sealed record ChangeTenantStatusCommand(Guid Id, TenantStatus Status) : ICommand<Unit>;

public sealed class ChangeTenantStatusHandler(IRepository<Tenant> tenants, ISessionValidator sessions)
    : IRequestHandler<ChangeTenantStatusCommand, Unit>
{
    public async Task<Result<Unit>> Handle(ChangeTenantStatusCommand request, CancellationToken cancellationToken)
    {
        var tenant = await tenants.FindAsync(request.Id, cancellationToken);
        if (tenant is null)
        {
            return Error.NotFound("Tenant");
        }

        tenant.ChangeStatus(request.Status);
        await sessions.InvalidateTenantAsync(tenant.Id, cancellationToken);
        return Unit.Value;
    }
}

/// <summary>Kills every session in a tenant: bumps the tenant session version and revokes all refresh tokens.</summary>
[RequiresPermission(Permission.PlatformSessionsManage)]
public sealed record ForceLogoutTenantCommand(Guid Id) : ICommand<int>;

public sealed class ForceLogoutTenantHandler(
    IRepository<Tenant> tenants,
    IRepository<ApplicationUser> users,
    IRepository<RefreshToken> tokens,
    ISessionValidator sessions,
    ICurrentUser currentUser,
    IAuditWriter audit,
    TimeProvider clock) : IRequestHandler<ForceLogoutTenantCommand, int>
{
    public async Task<Result<int>> Handle(ForceLogoutTenantCommand request, CancellationToken cancellationToken)
    {
        var tenant = await tenants.FindAsync(request.Id, cancellationToken);
        if (tenant is null)
        {
            return Error.NotFound("Tenant");
        }

        tenant.RevokeAllSessions();
        var userIds = users.Query().Where(u => u.TenantId == tenant.Id).Select(u => u.Id);
        var now = clock.GetUtcNow();
        var revoked = await tokens.QueryTracked()
            .Where(t => userIds.Contains(t.UserId) && t.RevokedAt == null)
            .ToListAsync(cancellationToken);
        revoked.ForEach(t => t.Revoke(now, "tenant force logout"));

        await sessions.InvalidateTenantAsync(tenant.Id, cancellationToken);
        await audit.WriteSecurityEventAsync(AuditAction.ForcedLogout, currentUser.UserId, tenant.Id, null, cancellationToken);
        return revoked.Count;
    }
}
