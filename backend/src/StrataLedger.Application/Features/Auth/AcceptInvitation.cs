using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Application.Common.Services;
using StrataLedger.Application.Features.Companies;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;
using StrataLedger.Domain.Strata;

namespace StrataLedger.Application.Features.Auth;

public sealed record InvitationPreview(string Email, string FirstName, string LastName, UserRole Role, string CompanyName,
    BrandingDto Branding, DateTimeOffset ExpiresAt, bool RequiresMfa);

[AllowAnonymousRequest]
public sealed record GetInvitationQuery(string Token) : IQuery<InvitationPreview>;

public sealed class GetInvitationHandler(
    IRepository<Invitation> invitations,
    IRepository<Company> companies,
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

        var company = await companies.Query().FirstAsync(c => c.Id == invitation.CompanyId, cancellationToken);
        return new InvitationPreview(invitation.Email, invitation.FirstName, invitation.LastName, invitation.Role,
            company.Name, BrandingDto.From(company.Branding, urls), invitation.ExpiresAt, invitation.Role != UserRole.Owner);
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
    IRepository<Owner> owners,
    IRepository<Lot> lots,
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
            CompanyId = invitation.CompanyId,
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

        await tenant.EnterCompanyScopeAsync(invitation.CompanyId, cancellationToken);
        await LinkOwnerAsync(invitation, user, cancellationToken);
        invitation.Accept(now);

        await audit.WriteSecurityEventAsync(AuditAction.InvitationAccepted, user.Id, user.CompanyId, invitation.Role.ToString(), cancellationToken);
        return await flow.ContinueAfterPasswordAsync(user, cancellationToken);
    }

    private async Task LinkOwnerAsync(Invitation invitation, ApplicationUser user, CancellationToken ct)
    {
        if (invitation.Role != UserRole.Owner)
        {
            return;
        }

        var owner = await owners.QueryTracked().FirstOrDefaultAsync(o => o.Email == invitation.Email, ct);
        if (owner is null)
        {
            owner = Owner.Create(invitation.CompanyId, user.FirstName, user.LastName, invitation.Email, null, null, null);
            owners.Add(owner);
        }

        owner.LinkUser(user.Id);

        var lot = invitation.LotId is { } lotId
            ? await lots.QueryTracked().Include(l => l.Ownerships).FirstOrDefaultAsync(l => l.Id == lotId, ct)
            : null;
        // Never over-allocate: a lot that is already fully owned keeps its existing ownership.
        lot?.AssignRemainingShare(owner.Id);
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
