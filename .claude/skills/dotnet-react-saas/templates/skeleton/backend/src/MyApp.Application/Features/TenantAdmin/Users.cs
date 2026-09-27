using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Models;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Domain.Authorization;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;

namespace MyApp.Application.Features.TenantAdmin;

public sealed record TenantUserDto(Guid Id, string Email, string FirstName, string LastName, UserRole Role,
    bool IsCommitteeMember, bool IsActive, bool MfaEnabled, bool IsLockedOut, DateTimeOffset CreatedAt, DateTimeOffset? LastLoginAt);

[RequiresPermission(Permission.TenantUsersRead)]
public sealed record ListTenantUsersQuery(Guid? TenantId, string? Search, UserRole? Role, int Page = 1, int PageSize = 25)
    : PageRequest(Page, PageSize), IQuery<PagedResult<TenantUserDto>>;

public sealed class ListTenantUsersHandler(ICurrentUser currentUser, UserManager<ApplicationUser> users, TimeProvider clock)
    : IRequestHandler<ListTenantUsersQuery, PagedResult<TenantUserDto>>
{
    public async Task<Result<PagedResult<TenantUserDto>>> Handle(ListTenantUsersQuery request, CancellationToken cancellationToken)
    {
        var tenantId = currentUser.ResolveTenant(request.TenantId);
        if (tenantId.IsFailure)
        {
            return tenantId.Error!;
        }

        var id = tenantId.Value;
        var now = clock.GetUtcNow();
        var term = request.Search?.Trim().ToUpperInvariant();
        var query = users.Users
            .Where(u => u.TenantId == id)
            .WhereIf(request.Role.HasValue, u => u.Role == request.Role)
            .WhereIf(!string.IsNullOrEmpty(term), u => u.NormalizedEmail!.Contains(term!) || u.LastName.ToUpper().Contains(term!))
            .OrderBy(u => u.LastName).ThenBy(u => u.FirstName)
            .Select(u => new TenantUserDto(u.Id, u.Email!, u.FirstName, u.LastName, u.Role, u.IsCommitteeMember, u.IsActive,
                u.TwoFactorEnabled, u.LockoutEnd != null && u.LockoutEnd > now, u.CreatedAt, u.LastLoginAt));

        return await query.ToPagedResultAsync(request, cancellationToken);
    }
}

[RequiresPermission(Permission.TenantUsersManage)]
public sealed record UpdateTenantUserCommand(Guid UserId, UserRole Role, bool IsCommitteeMember, bool IsActive) : ICommand<Unit>;

public sealed class UpdateTenantUserValidator : AbstractValidator<UpdateTenantUserCommand>
{
    public UpdateTenantUserValidator() => RuleFor(x => x.Role).IsInEnum().NotEqual(UserRole.SuperAdmin);
}

public sealed class UpdateTenantUserHandler(
    ICurrentUser currentUser,
    UserManager<ApplicationUser> users,
    IAuthSessionService sessions) : IRequestHandler<UpdateTenantUserCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateTenantUserCommand request, CancellationToken cancellationToken)
    {
        var user = await TenantUserAccess.FindManageableAsync(currentUser, users, request.UserId);
        if (user.IsFailure)
        {
            return user.Error!;
        }

        var target = user.Value;
        if (!InvitationPolicy.CanInvite(currentUser.Role!.Value, request.Role))
        {
            return Error.Forbidden("You cannot assign this role.");
        }

        var privilegeChanged = target.Role != request.Role || target.IsActive != request.IsActive;
        target.Role = request.Role;
        target.IsCommitteeMember = request.IsCommitteeMember;
        target.IsActive = request.IsActive;
        await users.UpdateAsync(target);

        if (privilegeChanged)
        {
            // Role or activation change must take effect immediately, not when the access token expires.
            await sessions.RevokeAllForUserAsync(target.Id, "role or status changed", cancellationToken);
        }

        return Unit.Value;
    }
}

[RequiresPermission(Permission.TenantUsersManage)]
public sealed record RevokeUserSessionsCommand(Guid UserId) : ICommand<int>;

public sealed class RevokeUserSessionsHandler(
    ICurrentUser currentUser,
    UserManager<ApplicationUser> users,
    IAuthSessionService sessions,
    IAuditWriter audit) : IRequestHandler<RevokeUserSessionsCommand, int>
{
    public async Task<Result<int>> Handle(RevokeUserSessionsCommand request, CancellationToken cancellationToken)
    {
        var user = await TenantUserAccess.FindManageableAsync(currentUser, users, request.UserId);
        if (user.IsFailure)
        {
            return user.Error!;
        }

        var count = await sessions.RevokeAllForUserAsync(user.Value.Id, "revoked by administrator", cancellationToken);
        await audit.WriteSecurityEventAsync(AuditAction.SessionRevoked, currentUser.UserId, user.Value.TenantId,
            $"user {user.Value.Id}", cancellationToken);
        return count;
    }
}

[RequiresPermission(Permission.TenantUsersManage)]
public sealed record UnlockUserCommand(Guid UserId) : ICommand<Unit>;

public sealed class UnlockUserHandler(ICurrentUser currentUser, UserManager<ApplicationUser> users)
    : IRequestHandler<UnlockUserCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UnlockUserCommand request, CancellationToken cancellationToken)
    {
        var user = await TenantUserAccess.FindManageableAsync(currentUser, users, request.UserId);
        if (user.IsFailure)
        {
            return user.Error!;
        }

        await users.SetLockoutEndDateAsync(user.Value, null);
        await users.ResetAccessFailedCountAsync(user.Value);
        return Unit.Value;
    }
}

internal static class TenantUserAccess
{
    /// <summary>Target must be in the caller's tenant (any tenant for Super Admin), not the caller, and not a Super Admin.</summary>
    public static async Task<Result<ApplicationUser>> FindManageableAsync(ICurrentUser currentUser,
        UserManager<ApplicationUser> users, Guid userId)
    {
        var user = await users.FindByIdAsync(userId.ToString());
        var visible = user is not null
            && user.Role != UserRole.SuperAdmin
            && (currentUser.IsSuperAdmin || user.TenantId == currentUser.TenantId);

        return (visible, user?.Id == currentUser.UserId) switch
        {
            (false, _) => Error.NotFound("User"),
            (true, true) => Error.Forbidden("You cannot change your own account here."),
            _ => user!,
        };
    }
}
