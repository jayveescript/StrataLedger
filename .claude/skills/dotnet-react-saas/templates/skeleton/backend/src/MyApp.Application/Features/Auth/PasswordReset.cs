using FluentValidation;
using Microsoft.AspNetCore.Identity;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;

namespace MyApp.Application.Features.Auth;

[AllowAnonymousRequest]
public sealed record ForgotPasswordCommand(string Email) : ICommand<Unit>;

public sealed class ForgotPasswordValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordValidator() => RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
}

/// <summary>Always succeeds so the endpoint cannot be used to discover which emails have accounts.</summary>
public sealed class ForgotPasswordHandler(UserManager<ApplicationUser> users, IEmailOutbox outbox, IAppUrls urls)
    : IRequestHandler<ForgotPasswordCommand, Unit>
{
    public async Task<Result<Unit>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await users.FindByEmailAsync(request.Email);
        if (user is not { IsActive: true })
        {
            return Unit.Value;
        }

        var token = await users.GeneratePasswordResetTokenAsync(user);
        await outbox.EnqueueAsync(user.TenantId, user.Email!, user.FullName, EmailTemplate.PasswordReset,
            new Dictionary<string, string>
            {
                ["name"] = user.FirstName,
                ["url"] = urls.ResetPassword(user.Email!, token),
            }, cancellationToken);

        return Unit.Value;
    }
}

[AllowAnonymousRequest]
public sealed record ResetPasswordCommand(string Email, string Token, string NewPassword) : ICommand<Unit>;

public sealed class ResetPasswordValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Token).NotEmpty().MaximumLength(2048);
        RuleFor(x => x.NewPassword).NotEmpty().MaximumLength(128);
    }
}

public sealed class ResetPasswordHandler(
    UserManager<ApplicationUser> users,
    IRepository<PasswordHistoryEntry> history,
    IAuthSessionService sessions,
    IAuditWriter audit,
    IEmailOutbox outbox,
    TimeProvider clock) : IRequestHandler<ResetPasswordCommand, Unit>
{
    public async Task<Result<Unit>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await users.FindByEmailAsync(request.Email);
        if (user is not { IsActive: true })
        {
            return AuthErrors.InvalidResetToken;
        }

        var previousHash = user.PasswordHash;
        var result = await users.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            return result.ToError("newPassword", AuthErrors.InvalidResetToken);
        }

        await PasswordChangeSideEffects.ApplyAsync(user, previousHash, history, sessions, audit, outbox, clock,
            AuditAction.PasswordReset, cancellationToken);
        await users.SetLockoutEndDateAsync(user, null);
        return Unit.Value;
    }
}

internal static class PasswordChangeSideEffects
{
    /// <summary>
    /// Records the outgoing password in history (the current one is always checked separately), revokes every session,
    /// audits and notifies the user.
    /// </summary>
    public static async Task ApplyAsync(ApplicationUser user, string? previousHash, IRepository<PasswordHistoryEntry> history,
        IAuthSessionService sessions, IAuditWriter audit, IEmailOutbox outbox, TimeProvider clock, AuditAction action,
        CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        user.PasswordChangedAt = now;
        if (!string.IsNullOrEmpty(previousHash))
        {
            history.Add(new PasswordHistoryEntry(user.Id, previousHash, now));
        }

        await sessions.RevokeAllForUserAsync(user.Id, "password changed", ct);
        await audit.WriteSecurityEventAsync(action, user.Id, user.TenantId, null, ct);
        await outbox.EnqueueAsync(user.TenantId, user.Email!, user.FullName, EmailTemplate.PasswordChanged,
            new Dictionary<string, string> { ["name"] = user.FirstName }, ct);
    }
}
