using System.Text.RegularExpressions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Models;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Application.Common.Services;
using StrataLedger.Application.Features.Companies;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;
using StrataLedger.Domain.Strata;

namespace StrataLedger.Application.Features.Platform;

public sealed record CompanyListItem(Guid Id, string Name, string Slug, string? Abn, SubscriptionTier Tier,
    CompanyStatus Status, IReadOnlyList<AustralianState> States, string ContactEmail, int PlanCount, int UserCount,
    DateTimeOffset CreatedAt);

public sealed record CompanyDetail(Guid Id, string Name, string Slug, string? Abn, string ContactName, string ContactEmail,
    string? Phone, IReadOnlyList<AustralianState> States, SubscriptionTier Tier, CompanyStatus Status,
    DateTimeOffset CreatedAt, BrandingDto Branding, UsageDto Usage);

[RequiresPermission(Permission.PlatformCompaniesManage)]
public sealed record ListCompaniesQuery(string? Search, CompanyStatus? Status, SubscriptionTier? Tier, int Page = 1, int PageSize = 25)
    : PageRequest(Page, PageSize), IQuery<PagedResult<CompanyListItem>>;

public sealed class ListCompaniesHandler(
    IRepository<Company> companies,
    IRepository<StrataPlan> plans,
    IRepository<ApplicationUser> users) : IRequestHandler<ListCompaniesQuery, PagedResult<CompanyListItem>>
{
    public async Task<Result<PagedResult<CompanyListItem>>> Handle(ListCompaniesQuery request, CancellationToken cancellationToken)
    {
        var term = request.Search?.Trim().ToLower();
        var query = companies.Query()
            .WhereIf(!string.IsNullOrEmpty(term), c => c.Name.ToLower().Contains(term!) || c.ContactEmail.Contains(term!))
            .WhereIf(request.Status.HasValue, c => c.Status == request.Status)
            .WhereIf(request.Tier.HasValue, c => c.Tier == request.Tier)
            .OrderBy(c => c.Name)
            .Select(c => new CompanyListItem(c.Id, c.Name, c.Slug, c.Abn, c.Tier, c.Status, c.States, c.ContactEmail,
                plans.Query().IgnoreQueryFilters().Count(p => p.CompanyId == c.Id && !p.IsDeleted),
                users.Query().Count(u => u.CompanyId == c.Id),
                c.CreatedAt));

        return await query.ToPagedResultAsync(request, cancellationToken);
    }
}

[RequiresPermission(Permission.PlatformCompaniesManage)]
public sealed record GetCompanyQuery(Guid Id) : IQuery<CompanyDetail>;

public sealed class GetCompanyHandler(IRepository<Company> companies, UsageLimits limits, IAppUrls urls)
    : IRequestHandler<GetCompanyQuery, CompanyDetail>
{
    public async Task<Result<CompanyDetail>> Handle(GetCompanyQuery request, CancellationToken cancellationToken)
    {
        var c = await companies.Query().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (c is null)
        {
            return Error.NotFound("Company");
        }

        var usage = await limits.GetUsageAsync(c.Id, cancellationToken);
        return new CompanyDetail(c.Id, c.Name, c.Slug, c.Abn, c.ContactName, c.ContactEmail, c.Phone, c.States, c.Tier,
            c.Status, c.CreatedAt, BrandingDto.From(c.Branding, urls), usage);
    }
}

public abstract record CompanyFields(string Name, string? Abn, string ContactName, string ContactEmail, string? Phone,
    IReadOnlyList<AustralianState> States);

public sealed class CompanyFieldsValidator : AbstractValidator<CompanyFields>
{
    public CompanyFieldsValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Abn).Matches(@"^\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$").When(x => !string.IsNullOrWhiteSpace(x.Abn))
            .WithMessage("ABN must be 11 digits.");
        RuleFor(x => x.ContactName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ContactEmail).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.States).NotEmpty();
        RuleForEach(x => x.States).IsInEnum();
    }
}

[RequiresPermission(Permission.PlatformCompaniesManage)]
public sealed record CreateCompanyCommand(string Name, string? Abn, string ContactName, string ContactEmail, string? Phone,
    IReadOnlyList<AustralianState> States, SubscriptionTier Tier)
    : CompanyFields(Name, Abn, ContactName, ContactEmail, Phone, States), ICommand<Guid>;

public sealed class CreateCompanyValidator : AbstractValidator<CreateCompanyCommand>
{
    public CreateCompanyValidator()
    {
        Include(new CompanyFieldsValidator());
        RuleFor(x => x.Tier).IsInEnum();
    }
}

public sealed partial class CreateCompanyHandler(IRepository<Company> companies) : IRequestHandler<CreateCompanyCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateCompanyCommand request, CancellationToken cancellationToken)
    {
        var baseSlug = NonSlugChars().Replace(request.Name.Trim().ToLowerInvariant(), "-").Trim('-');
        var taken = await companies.Query().Where(c => c.Slug.StartsWith(baseSlug)).Select(c => c.Slug).ToListAsync(cancellationToken);
        var slug = Enumerable.Range(1, taken.Count + 1)
            .Select(n => n == 1 ? baseSlug : $"{baseSlug}-{n}")
            .First(s => !taken.Contains(s));

        var company = Company.Create(request.Name, slug, request.Abn, request.ContactName, request.ContactEmail,
            request.Phone, request.States, request.Tier);
        companies.Add(company);
        return company.Id;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlugChars();
}

[RequiresPermission(Permission.PlatformCompaniesManage)]
public sealed record UpdateCompanyCommand(Guid Id, string Name, string? Abn, string ContactName, string ContactEmail,
    string? Phone, IReadOnlyList<AustralianState> States)
    : CompanyFields(Name, Abn, ContactName, ContactEmail, Phone, States), ICommand<Unit>;

public sealed class UpdateCompanyValidator : AbstractValidator<UpdateCompanyCommand>
{
    public UpdateCompanyValidator() => Include(new CompanyFieldsValidator());
}

public sealed class UpdateCompanyHandler(IRepository<Company> companies) : IRequestHandler<UpdateCompanyCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateCompanyCommand request, CancellationToken cancellationToken)
    {
        var company = await companies.FindAsync(request.Id, cancellationToken);
        if (company is null)
        {
            return Error.NotFound("Company");
        }

        company.UpdateDetails(request.Name, request.Abn, request.ContactName, request.ContactEmail, request.Phone, request.States);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.PlatformCompaniesManage)]
public sealed record ChangeCompanyTierCommand(Guid Id, SubscriptionTier Tier) : ICommand<Unit>;

public sealed class ChangeCompanyTierHandler(IRepository<Company> companies, IFeatureService features)
    : IRequestHandler<ChangeCompanyTierCommand, Unit>
{
    public async Task<Result<Unit>> Handle(ChangeCompanyTierCommand request, CancellationToken cancellationToken)
    {
        var company = await companies.FindAsync(request.Id, cancellationToken);
        if (company is null)
        {
            return Error.NotFound("Company");
        }

        company.ChangeTier(request.Tier);
        await features.InvalidateAsync(company.Id, cancellationToken);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.PlatformCompaniesManage)]
public sealed record ChangeCompanyStatusCommand(Guid Id, CompanyStatus Status) : ICommand<Unit>;

public sealed class ChangeCompanyStatusHandler(IRepository<Company> companies, ISessionValidator sessions)
    : IRequestHandler<ChangeCompanyStatusCommand, Unit>
{
    public async Task<Result<Unit>> Handle(ChangeCompanyStatusCommand request, CancellationToken cancellationToken)
    {
        var company = await companies.FindAsync(request.Id, cancellationToken);
        if (company is null)
        {
            return Error.NotFound("Company");
        }

        company.ChangeStatus(request.Status);
        await sessions.InvalidateCompanyAsync(company.Id, cancellationToken);
        return Unit.Value;
    }
}

/// <summary>Kills every session in a company: bumps the company session version and revokes all refresh tokens.</summary>
[RequiresPermission(Permission.PlatformSessionsManage)]
public sealed record ForceLogoutCompanyCommand(Guid Id) : ICommand<int>;

public sealed class ForceLogoutCompanyHandler(
    IRepository<Company> companies,
    IRepository<ApplicationUser> users,
    IRepository<RefreshToken> tokens,
    ISessionValidator sessions,
    ICurrentUser currentUser,
    IAuditWriter audit,
    TimeProvider clock) : IRequestHandler<ForceLogoutCompanyCommand, int>
{
    public async Task<Result<int>> Handle(ForceLogoutCompanyCommand request, CancellationToken cancellationToken)
    {
        var company = await companies.FindAsync(request.Id, cancellationToken);
        if (company is null)
        {
            return Error.NotFound("Company");
        }

        company.RevokeAllSessions();
        var userIds = users.Query().Where(u => u.CompanyId == company.Id).Select(u => u.Id);
        var now = clock.GetUtcNow();
        var revoked = await tokens.QueryTracked()
            .Where(t => userIds.Contains(t.UserId) && t.RevokedAt == null)
            .ToListAsync(cancellationToken);
        revoked.ForEach(t => t.Revoke(now, "company force logout"));

        await sessions.InvalidateCompanyAsync(company.Id, cancellationToken);
        await audit.WriteSecurityEventAsync(AuditAction.ForcedLogout, currentUser.UserId, company.Id, null, cancellationToken);
        return revoked.Count;
    }
}
