using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Application.Features.Tenants;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;

namespace MyApp.Application.Features.Auth;

public sealed record InvitationPreview(string Email, string FirstName, string LastName, UserRole Role, string TenantName,
    BrandingDto Branding, DateTimeOffset ExpiresAt, bool RequiresMfa);

[AllowAnonymousRequest]
public sealed record GetInvitationQuery(string Token) : IQuery<InvitationPreview>;

public sealed class GetInvitationHandler(
    IRepository<Invitation> invitations,
    IRepository<Tenant> tenants,
    ISecureTokenGenerator tokens,
    IAppUrls urls,
    TimeProvider clock) : IRequestHandler<GetInvitationQuery, InvitationPreview>
{
    public async Task<Result<InvitationPreview>> Handle(GetInvitationQuery request, CancellationToken cancellationToken)
    {
        var invitation = await InvitationLookup.FindAcceptableAsync(invitations, tokens, request.Token, clock, cancellationToken);
        if (invitation is null)
        {
            return AuthErrors.InvalidInvitation;
        }

        var tenant = await tenants.Query().FirstAsync(c => c.Id == invitation.TenantId, cancellationToken);
        return new InvitationPreview(invitation.Email, invitation.FirstName, invitation.LastName, invitation.Role,
            tenant.Name, BrandingDto.From(tenant.Branding, urls), invitation.ExpiresAt, invitation.Role != UserRole.Member);
    }
}

[AllowAnonymousRequest]
public sealed record AcceptInvitationCommand(string Token, string FirstName, string LastName, string Password)
    : ICommand<SignInResult>;

public sealed class AcceptInvitationValidator : AbstractValidator<AcceptInvitationCommand>
{
    public AcceptInvitationValidator()
    {
        RuleFor(x => x.Token).NotEmpty().MaximumLength(256);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(128);
    }
}

public sealed class AcceptInvitationHandler(
    IRepository<Invitation> invitations,
    UserManager<ApplicationUser> users,
    ITenantContext tenant,
    ISecureTokenGenerator tokens,
    IAuditWriter audit,
    SignInFlow flow,
    TimeProvider clock) : IRequestHandler<AcceptInvitationCommand, SignInResult>
{
    public async Task<Result<SignInResult>> Handle(AcceptInvitationCommand request, CancellationToken cancellationToken)
    {
        var invitation = await InvitationLookup.FindAcceptableAsync(invitations, tokens, request.Token, clock, cancellationToken, tracked: true);
        if (invitation is null)
        {
            return AuthErrors.InvalidInvitation;
        }

        if (await users.FindByEmailAsync(invitation.Email) is not null)
        {
            return Error.Conflict("user.exists", "An account already exists for this email. Please sign in instead.");
        }

        var now = clock.GetUtcNow();
        var user = new ApplicationUser
        {
            UserName = invitation.Email,
            Email = invitation.Email,
            EmailConfirmed = true,
            TenantId = invitation.TenantId,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Role = invitation.Role,
            CreatedAt = now,
            PasswordChangedAt = now,
            LockoutEnabled = true,
        };

        var created = await users.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            return created.ToError("password");
        }

        await tenant.EnterTenantScopeAsync(invitation.TenantId, cancellationToken);
        // Link domain records to the new user here (e.g. a customer profile), inside the tenant scope.
        invitation.Accept(now);

        await audit.WriteSecurityEventAsync(AuditAction.InvitationAccepted, user.Id, user.TenantId, invitation.Role.ToString(), cancellationToken);
        return await flow.ContinueAfterPasswordAsync(user, cancellationToken);
    }

}

internal static class InvitationLookup
{
    /// <summary>Invitations are looked up by token hash across tenants: the caller is anonymous at this point.</summary>
    public static Task<Invitation?> FindAcceptableAsync(IRepository<Invitation> invitations, ISecureTokenGenerator tokens,
        string token, TimeProvider clock, CancellationToken ct, bool tracked = false)
    {
        var hash = tokens.Hash(token);
        var now = clock.GetUtcNow();
        var source = tracked ? invitations.QueryTracked() : invitations.Query();
        return source.IgnoreQueryFilters()
            .Where(i => i.TokenHash == hash && i.Status == InvitationStatus.Pending && i.ExpiresAt > now)
            .FirstOrDefaultAsync(ct);
    }
}
