using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Services;
using MyApp.Application.Features.Tenants;
using MyApp.Domain.Authorization;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;

namespace MyApp.Application.Features.Account;

public sealed record MeTenant(Guid Id, string Name, SubscriptionTier Tier, TenantStatus Status);

public sealed record MeResponse(
    Guid Id, string Email, string FirstName, string LastName, UserRole Role, bool IsCommitteeMember, bool MfaEnabled,
    MeTenant? Tenant, IReadOnlyList<Permission> Permissions, IReadOnlyList<Feature> Features, BrandingDto Branding);

/// <summary>Everything the SPA needs after sign-in: identity, permissions, enabled features and branding.</summary>
public sealed record GetMeQuery : IQuery<MeResponse>;

public sealed class GetMeHandler(
    ICurrentUser currentUser,
    UserManager<ApplicationUser> users,
    IRepository<Tenant> tenants,
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

        var tenant = user.TenantId is { } tenantId
            ? await tenants.Query().FirstOrDefaultAsync(c => c.Id == tenantId, cancellationToken)
            : null;

        var enabled = tenant is null
            ? Enum.GetValues<Feature>()
            : (await features.GetEnabledFeaturesAsync(tenant.Id, cancellationToken)).Order().ToArray();

        return new MeResponse(
            user.Id, user.Email!, user.FirstName, user.LastName, user.Role, user.IsCommitteeMember, user.TwoFactorEnabled,
            tenant is null ? null : new MeTenant(tenant.Id, tenant.Name, tenant.Tier, tenant.Status),
            RolePermissions.For(user.Role).Order().ToArray(),
            enabled,
            tenant is null ? BrandingDto.Platform(urls) : BrandingDto.From(tenant.Branding, urls));
    }
}
