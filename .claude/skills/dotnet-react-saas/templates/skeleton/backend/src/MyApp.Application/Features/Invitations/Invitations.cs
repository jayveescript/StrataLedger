using System.Net.Mail;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Models;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Domain.Authorization;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;

namespace MyApp.Application.Features.Invitations;

public sealed record InvitationRowInput(string Email, string FirstName, string LastName, UserRole Role);

public sealed record InvitationRowPreview(int RowNumber, string Email, string FirstName, string LastName, string Role,
    UserRole? ParsedRole, IReadOnlyList<string> Errors)
{
    public bool IsValid => Errors.Count == 0;
}

public sealed record InvitationUploadPreview(string FileName, int TotalRows, int ValidRows, IReadOnlyList<InvitationRowPreview> Rows);

public sealed record InvitationBatchResult(Guid BatchId, int Sent, IReadOnlyList<InvitationRowPreview> Rejected);

public sealed record InvitationDto(Guid Id, string Email, string FirstName, string LastName, UserRole Role,
    InvitationStatus Status, DateTimeOffset ExpiresAt, DateTimeOffset? AcceptedAt, int SendCount, DateTimeOffset? LastSentAt);

/// <summary>Validates rows against roles the caller may grant, tier features, and existing users.</summary>
public sealed class InvitationRowValidator(
    ICurrentUser currentUser,
    IFeatureService features,
    UserManager<ApplicationUser> users,
    IRepository<Invitation> invitations)
{
    private const int MaxRows = 2_000;

    public sealed record ResolvedRow(InvitationRowPreview Preview);

    public async Task<Result<IReadOnlyList<ResolvedRow>>> ValidateAsync(Guid tenantId, IReadOnlyList<InvitationFileRow> rows,
        CancellationToken ct)
    {
        if (rows.Count > MaxRows)
        {
            return Error.Validation("invitations.too_many_rows", $"A single upload may contain at most {MaxRows} rows.");
        }

        var enabled = await features.GetEnabledFeaturesAsync(tenantId, ct);
        var emails = rows.Select(r => r.Email.Trim().ToLowerInvariant()).ToHashSet();
        var normalized = emails.Select(e => e.ToUpperInvariant()).ToList();
        var existingUsers = (await users.Users.Where(u => normalized.Contains(u.NormalizedEmail!))
            .Select(u => u.NormalizedEmail!).ToListAsync(ct)).Select(e => e.ToLowerInvariant()).ToHashSet();
        var pending = (await invitations.Query().IgnoreQueryFilters()
            .Where(i => i.TenantId == tenantId && i.Status == InvitationStatus.Pending && emails.Contains(i.Email))
            .Select(i => i.Email).ToListAsync(ct)).ToHashSet();

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var resolved = rows.Select(row =>
        {
            var errors = new List<string>();
            var email = row.Email.Trim().ToLowerInvariant();
            var role = RoleLabels.TryParse(row.Role);

            AddIf(errors, !IsEmail(email), "Email address is invalid.");
            AddIf(errors, !seen.Add(email), "Duplicate email in this file.");
            AddIf(errors, existingUsers.Contains(email), "A user with this email already exists.");
            AddIf(errors, pending.Contains(email), "A pending invitation already exists for this email.");
            AddIf(errors, string.IsNullOrWhiteSpace(row.FirstName), "First name is required.");
            AddIf(errors, string.IsNullOrWhiteSpace(row.LastName), "Last name is required.");
            AddIf(errors, row.FirstName.Length > 100 || row.LastName.Length > 100, "Names must be 100 characters or fewer.");
            AddIf(errors, role is null, $"Unknown role '{row.Role}'. Use Member, Viewer, Manager or Tenant Admin.");
            AddIf(errors, role is { } r && !InvitationPolicy.CanInvite(currentUser.Role!.Value, r), "You are not allowed to invite this role.");
            AddIf(errors, role == UserRole.Member && !enabled.Contains(Feature.MemberInvitations), "Member invitations are not included in this plan.");


            var preview = new InvitationRowPreview(row.RowNumber, email, row.FirstName.Trim(), row.LastName.Trim(), row.Role,
                role, errors);
            return new ResolvedRow(preview);
        }).ToList();

        return resolved;
    }

    private static void AddIf(List<string> errors, bool condition, string message)
    {
        if (condition)
        {
            errors.Add(message);
        }
    }

    private static bool IsEmail(string email) =>
        email.Length <= 256 && MailAddress.TryCreate(email, out var parsed) && parsed.Address == email;
}

// ---- Preview upload (no side effects) -------------------------------------------------------------------------

[RequiresPermission(Permission.MembersInvite)]
public sealed record PreviewInvitationUploadQuery(Guid? TenantId, string FileName, Stream Content) : IQuery<InvitationUploadPreview>;

public sealed class PreviewInvitationUploadHandler(ICurrentUser currentUser, IInvitationFileParser parser, InvitationRowValidator validator)
    : IRequestHandler<PreviewInvitationUploadQuery, InvitationUploadPreview>
{
    public async Task<Result<InvitationUploadPreview>> Handle(PreviewInvitationUploadQuery request, CancellationToken cancellationToken)
    {
        var tenant = currentUser.ResolveTenant(request.TenantId);
        if (tenant.IsFailure)
        {
            return tenant.Error!;
        }

        var rows = await parser.ParseAsync(request.Content, request.FileName, cancellationToken);
        var validated = await validator.ValidateAsync(tenant.Value, rows, cancellationToken);
        return validated.Match<Result<InvitationUploadPreview>>(
            list => new InvitationUploadPreview(request.FileName, list.Count, list.Count(r => r.Preview.IsValid),
                list.Select(r => r.Preview).ToList()),
            error => error);
    }
}

// ---- Send ----------------------------------------------------------------------------------------------------

[RequiresPermission(Permission.MembersInvite)]
public sealed record SendInvitationsCommand(Guid? TenantId, string FileName, IReadOnlyList<InvitationRowInput> Rows)
    : ICommand<InvitationBatchResult>;

public sealed class SendInvitationsValidator : AbstractValidator<SendInvitationsCommand>
{
    public SendInvitationsValidator()
    {
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Rows).NotEmpty();
        RuleForEach(x => x.Rows).ChildRules(r => r.RuleFor(x => x.Role).IsInEnum());
    }
}

public sealed class SendInvitationsHandler(
    ICurrentUser currentUser,
    IRepository<Tenant> tenants,
    IRepository<InvitationBatch> batches,
    InvitationRowValidator validator,
    InvitationService invitationService,
    IAuditWriter audit) : IRequestHandler<SendInvitationsCommand, InvitationBatchResult>
{
    public async Task<Result<InvitationBatchResult>> Handle(SendInvitationsCommand request, CancellationToken cancellationToken)
    {
        var tenantId = currentUser.ResolveTenant(request.TenantId);
        if (tenantId.IsFailure)
        {
            return tenantId.Error!;
        }

        var tenant = await tenants.Query().FirstOrDefaultAsync(c => c.Id == tenantId.Value, cancellationToken);
        if (tenant is not { Status: TenantStatus.Active })
        {
            return Error.NotFound("Tenant");
        }

        var fileRows = request.Rows.Select((r, i) => new InvitationFileRow(i + 1, r.Email, r.FirstName, r.LastName,
            r.Role.ToString())).ToList();
        var validated = await validator.ValidateAsync(tenant.Id, fileRows, cancellationToken);
        if (validated.IsFailure)
        {
            return validated.Error!;
        }

        var accepted = validated.Value.Where(r => r.Preview.IsValid).ToList();
        var batch = new InvitationBatch(tenant.Id, request.FileName, request.Rows.Count);
        batches.Add(batch);

        foreach (var row in accepted)
        {
            var p = row.Preview;
            await invitationService.CreateAndSendAsync(tenant, batch.Id, p.Email, p.FirstName, p.LastName, p.ParsedRole!.Value,
                cancellationToken);
        }

        await audit.WriteSecurityEventAsync(AuditAction.InvitationSent, currentUser.UserId, tenant.Id,
            $"{accepted.Count} invitation(s) from {request.FileName}", cancellationToken);

        return new InvitationBatchResult(batch.Id, accepted.Count,
            validated.Value.Where(r => !r.Preview.IsValid).Select(r => r.Preview).ToList());
    }
}

// ---- List / resend / revoke -------------------------------------------------------------------------------------

[RequiresPermission(Permission.MembersInvite)]
public sealed record ListInvitationsQuery(Guid? TenantId, InvitationStatus? Status, string? Search, int Page = 1, int PageSize = 25)
    : PageRequest(Page, PageSize), IQuery<PagedResult<InvitationDto>>;

public sealed class ListInvitationsHandler(
    ICurrentUser currentUser,
    IRepository<Invitation> invitations) : IRequestHandler<ListInvitationsQuery, PagedResult<InvitationDto>>
{
    public async Task<Result<PagedResult<InvitationDto>>> Handle(ListInvitationsQuery request, CancellationToken cancellationToken)
    {
        var tenantId = currentUser.ResolveTenant(request.TenantId);
        if (tenantId.IsFailure)
        {
            return tenantId.Error!;
        }

        var id = tenantId.Value;
        var term = request.Search?.Trim().ToLower();
        var query = invitations.Query().IgnoreQueryFilters()
            .Where(i => i.TenantId == id)
            .WhereIf(request.Status.HasValue, i => i.Status == request.Status)
            .WhereIf(!string.IsNullOrEmpty(term), i => i.Email.Contains(term!) || i.LastName.ToLower().Contains(term!))
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvitationDto(i.Id, i.Email, i.FirstName, i.LastName, i.Role, i.Status, i.ExpiresAt, i.AcceptedAt,
                i.SendCount, i.LastSentAt));

        return await query.ToPagedResultAsync(request, cancellationToken);
    }
}

[RequiresPermission(Permission.MembersInvite)]
public sealed record ResendInvitationCommand(Guid Id) : ICommand<Unit>;

public sealed class ResendInvitationHandler(
    ICurrentUser currentUser,
    IRepository<Invitation> invitations,
    IRepository<Tenant> tenants,
    InvitationService invitationService) : IRequestHandler<ResendInvitationCommand, Unit>
{
    private const int MaxSends = 5;

    public async Task<Result<Unit>> Handle(ResendInvitationCommand request, CancellationToken cancellationToken)
    {
        var invitation = await InvitationAccess.FindAsync(currentUser, invitations, request.Id, cancellationToken);
        if (invitation is null)
        {
            return Error.NotFound("Invitation");
        }

        if (invitation.Status is InvitationStatus.Accepted or InvitationStatus.Revoked)
        {
            return Error.Conflict("invitation.closed", "This invitation has already been accepted or revoked.");
        }

        if (invitation.SendCount >= MaxSends)
        {
            return Error.LimitReached("invitation.resend_limit", "This invitation has been sent too many times.");
        }

        var tenant = await tenants.Query().FirstAsync(c => c.Id == invitation.TenantId, cancellationToken);
        await invitationService.ReissueAndSendAsync(tenant, invitation, cancellationToken);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.MembersInvite)]
public sealed record RevokeInvitationCommand(Guid Id) : ICommand<Unit>;

public sealed class RevokeInvitationHandler(ICurrentUser currentUser, IRepository<Invitation> invitations)
    : IRequestHandler<RevokeInvitationCommand, Unit>
{
    public async Task<Result<Unit>> Handle(RevokeInvitationCommand request, CancellationToken cancellationToken)
    {
        var invitation = await InvitationAccess.FindAsync(currentUser, invitations, request.Id, cancellationToken);
        if (invitation is not { Status: InvitationStatus.Pending })
        {
            return Error.NotFound("Invitation");
        }

        invitation.Revoke();
        return Unit.Value;
    }
}

internal static class InvitationAccess
{
    /// <summary>Loads an invitation the caller may manage: own tenant, and a role they are allowed to grant.</summary>
    public static async Task<Invitation?> FindAsync(ICurrentUser currentUser, IRepository<Invitation> invitations, Guid id,
        CancellationToken ct)
    {
        var invitation = await invitations.QueryTracked().FirstOrDefaultAsync(i => i.Id == id, ct);
        return invitation is not null && InvitationPolicy.CanInvite(currentUser.Role!.Value, invitation.Role) ? invitation : null;
    }
}
