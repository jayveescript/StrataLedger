using FluentValidation;
using Microsoft.AspNetCore.Identity;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;

namespace MyApp.Application.Features.Auth;

[AllowAnonymousRequest, NonTransactional]
public sealed record LoginCommand(string Email, string Password) : ICommand<SignInResult>;

public sealed class LoginValidator : AbstractValidator<LoginCommand>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(256);
    }
}

public sealed class LoginHandler(
    UserManager<ApplicationUser> users,
    IPasswordHasher<ApplicationUser> hasher,
    SignInFlow flow,
    IAuditWriter audit) : IRequestHandler<LoginCommand, SignInResult>
{
    // Verified against when the email is unknown so response time does not reveal which accounts exist.
    private static readonly ApplicationUser DummyUser = new();
    private static string? _dummyHash;

    public async Task<Result<SignInResult>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await users.FindByEmailAsync(request.Email);
        if (user is null)
        {
            _dummyHash ??= hasher.HashPassword(DummyUser, Guid.NewGuid().ToString());
            hasher.VerifyHashedPassword(DummyUser, _dummyHash, request.Password);
            await audit.WriteSecurityEventAsync(AuditAction.LoginFailed, null, null, "unknown email", cancellationToken);
            return AuthErrors.InvalidCredentials;
        }

        var allowed = !await users.IsLockedOutAsync(user) && await flow.CanSignInAsync(user, cancellationToken);
        var passwordOk = allowed && await users.CheckPasswordAsync(user, request.Password);

        if (!passwordOk)
        {
            await RecordFailureAsync(user, allowed, cancellationToken);
            return AuthErrors.InvalidCredentials;
        }

        await users.ResetAccessFailedCountAsync(user);
        var result = await flow.ContinueAfterPasswordAsync(user, cancellationToken);
        if (result.Step == SignInStep.Completed)
        {
            await audit.WriteSecurityEventAsync(AuditAction.LoginSucceeded, user.Id, user.TenantId, null, cancellationToken);
        }

        return result;
    }

    private async Task RecordFailureAsync(ApplicationUser user, bool countAttempt, CancellationToken ct)
    {
        if (countAttempt)
        {
            await users.AccessFailedAsync(user);
        }

        var locked = await users.IsLockedOutAsync(user);
        await audit.WriteSecurityEventAsync(locked ? AuditAction.LockedOut : AuditAction.LoginFailed,
            user.Id, user.TenantId, null, ct);
    }
}
