using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Services;
using MyApp.Application.Features.Auth;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;

namespace MyApp.Application.Features.Account;

public sealed record UpdateProfileCommand(string FirstName, string LastName, string? PhoneNumber) : ICommand<Unit>;

public sealed class UpdateProfileValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PhoneNumber).MaximumLength(30);
    }
}

public sealed class UpdateProfileHandler(ICurrentUser currentUser, UserManager<ApplicationUser> users)
    : IRequestHandler<UpdateProfileCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = (await users.FindByIdAsync(currentUser.RequiredUserId.ToString()))!;
        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.PhoneNumber = request.PhoneNumber?.Trim();
        var result = await users.UpdateAsync(user);
        return result.Succeeded ? Unit.Value : result.ToError("profile");
    }
}

public sealed record ChangePasswordCommand(string CurrentPassword, string NewPassword) : ICommand<Unit>;

public sealed class ChangePasswordValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty().MaximumLength(128);
        RuleFor(x => x.NewPassword).NotEmpty().MaximumLength(128).NotEqual(x => x.CurrentPassword)
            .WithMessage("The new password must be different from the current password.");
    }
}

public sealed class ChangePasswordHandler(
    ICurrentUser currentUser,
    UserManager<ApplicationUser> users,
    IRepository<PasswordHistoryEntry> history,
    IAuthSessionService sessions,
    IAuditWriter audit,
    IEmailOutbox outbox,
    TimeProvider clock) : IRequestHandler<ChangePasswordCommand, Unit>
{
    public async Task<Result<Unit>> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = (await users.FindByIdAsync(currentUser.RequiredUserId.ToString()))!;
        var previousHash = user.PasswordHash;
        var result = await users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return result.ToError("newPassword");
        }

        await PasswordChangeSideEffects.ApplyAsync(user, previousHash, history, sessions, audit, outbox, clock,
            AuditAction.PasswordChanged, cancellationToken);
        return Unit.Value;
    }
}

public sealed record SessionDto(Guid Id, DateTimeOffset CreatedAt, DateTimeOffset LastUsedAt, DateTimeOffset ExpiresAt,
    string? IpAddress, string? UserAgent);

public sealed record ListMySessionsQuery : IQuery<IReadOnlyList<SessionDto>>;

public sealed class ListMySessionsHandler(ICurrentUser currentUser, IRepository<RefreshToken> tokens, TimeProvider clock)
    : IRequestHandler<ListMySessionsQuery, IReadOnlyList<SessionDto>>
{
    public async Task<Result<IReadOnlyList<SessionDto>>> Handle(ListMySessionsQuery request, CancellationToken cancellationToken) =>
        Result<IReadOnlyList<SessionDto>>.Success(
            await SessionQueries.ActiveForUserAsync(tokens, currentUser.RequiredUserId, clock.GetUtcNow(), cancellationToken));
}

public sealed record RevokeMySessionCommand(Guid SessionId) : ICommand<Unit>;

public sealed class RevokeMySessionHandler(ICurrentUser currentUser, IRepository<RefreshToken> tokens, IAuditWriter audit, TimeProvider clock)
    : IRequestHandler<RevokeMySessionCommand, Unit>
{
    public async Task<Result<Unit>> Handle(RevokeMySessionCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId;
        var token = await tokens.QueryTracked()
            .FirstOrDefaultAsync(t => t.Id == request.SessionId && t.UserId == userId, cancellationToken);
        if (token is null)
        {
            return Error.NotFound("Session");
        }

        // Revoke every token in the family so the device cannot rotate back in.
        var family = await tokens.QueryTracked().Where(t => t.FamilyId == token.FamilyId).ToListAsync(cancellationToken);
        var now = clock.GetUtcNow();
        family.ForEach(t => t.Revoke(now, "revoked by user"));
        await audit.WriteSecurityEventAsync(AuditAction.SessionRevoked, userId, currentUser.TenantId, token.Id.ToString(), cancellationToken);
        return Unit.Value;
    }
}

public sealed record RevokeAllMySessionsCommand : ICommand<int>;

public sealed class RevokeAllMySessionsHandler(ICurrentUser currentUser, IAuthSessionService sessions, IAuditWriter audit)
    : IRequestHandler<RevokeAllMySessionsCommand, int>
{
    public async Task<Result<int>> Handle(RevokeAllMySessionsCommand request, CancellationToken cancellationToken)
    {
        var count = await sessions.RevokeAllForUserAsync(currentUser.RequiredUserId, "user signed out everywhere", cancellationToken);
        await audit.WriteSecurityEventAsync(AuditAction.SessionRevoked, currentUser.UserId, currentUser.TenantId, "all", cancellationToken);
        return count;
    }
}

internal static class SessionQueries
{
    public static async Task<IReadOnlyList<SessionDto>> ActiveForUserAsync(IRepository<RefreshToken> tokens, Guid userId,
        DateTimeOffset now, CancellationToken ct) =>
        await tokens.Query()
            .Where(t => t.UserId == userId && t.RevokedAt == null && t.ExpiresAt > now)
            .OrderByDescending(t => t.LastUsedAt)
            .Select(t => new SessionDto(t.Id, t.CreatedAt, t.LastUsedAt, t.ExpiresAt, t.IpAddress, t.UserAgent))
            .ToListAsync(ct);
}
