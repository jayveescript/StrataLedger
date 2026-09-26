using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Services;
using StrataLedger.Application.Features.Companies;
using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;

namespace StrataLedger.Application.Features.Account;

public sealed record MeCompany(Guid Id, string Name, SubscriptionTier Tier, CompanyStatus Status);

public sealed record MeResponse(
    Guid Id, string Email, string FirstName, string LastName, UserRole Role, bool IsCommitteeMember, bool MfaEnabled,
    MeCompany? Company, IReadOnlyList<Permission> Permissions, IReadOnlyList<Feature> Features, BrandingDto Branding);

/// <summary>Everything the SPA needs after sign-in: identity, permissions, enabled features and branding.</summary>
public sealed record GetMeQuery : IQuery<MeResponse>;

public sealed class GetMeHandler(
    ICurrentUser currentUser,
    UserManager<ApplicationUser> users,
    IRepository<Company> companies,
    IFeatureService features,
    IAppUrls urls) : IRequestHandler<GetMeQuery, MeResponse>
{
    public async Task<Result<MeResponse>> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(currentUser.RequiredUserId.ToString());
        if (user is null)
        {
            return Error.Unauthorized();
        }

        var company = user.CompanyId is { } companyId
            ? await companies.Query().FirstOrDefaultAsync(c => c.Id == companyId, cancellationToken)
            : null;

        var enabled = company is null
            ? Enum.GetValues<Feature>()
            : (await features.GetEnabledFeaturesAsync(company.Id, cancellationToken)).Order().ToArray();

        return new MeResponse(
            user.Id, user.Email!, user.FirstName, user.LastName, user.Role, user.IsCommitteeMember, user.TwoFactorEnabled,
            company is null ? null : new MeCompany(company.Id, company.Name, company.Tier, company.Status),
            RolePermissions.For(user.Role).Order().ToArray(),
            enabled,
            company is null ? BrandingDto.Platform(urls) : BrandingDto.From(company.Branding, urls));
    }
}
