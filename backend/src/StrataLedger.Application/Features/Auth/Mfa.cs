using FluentValidation;
using Microsoft.AspNetCore.Identity;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;

namespace StrataLedger.Application.Features.Auth;

// ---- Verify (second factor during login) ----------------------------------------------------------------------

[AllowAnonymousRequest, NonTransactional]
public sealed record VerifyMfaCommand(string MfaToken, string Code, bool IsRecoveryCode = false) : ICommand<SignInResult>;

public sealed class VerifyMfaValidator : AbstractValidator<VerifyMfaCommand>
{
    public VerifyMfaValidator()
    {
        RuleFor(x => x.MfaToken).NotEmpty().MaximumLength(2048);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(32);
    }
}

public sealed class VerifyMfaHandler(UserManager<ApplicationUser> users, SignInFlow flow, IAuditWriter audit)
    : IRequestHandler<VerifyMfaCommand, SignInResult>
{
    public async Task<Result<SignInResult>> Handle(VerifyMfaCommand request, CancellationToken cancellationToken)
    {
        var resolved = await flow.ResolveMfaUserAsync(request.MfaToken);
        if (resolved.IsFailure)
        {
            return resolved.Error!;
        }

        var user = resolved.Value;
        var verified = user.TwoFactorEnabled
            && !await users.IsLockedOutAsync(user)
            && await flow.CanSignInAsync(user, cancellationToken)
            && await VerifyAsync(user, request, cancellationToken);

        if (!verified)
        {
            await users.AccessFailedAsync(user);
            await audit.WriteSecurityEventAsync(AuditAction.MfaFailed, user.Id, user.CompanyId, null, cancellationToken);
            return AuthErrors.InvalidMfaCode;
        }

        await users.ResetAccessFailedCountAsync(user);
        await audit.WriteSecurityEventAsync(AuditAction.LoginSucceeded, user.Id, user.CompanyId, "mfa", cancellationToken);
        return await flow.CompleteAsync(user, cancellationToken);
    }

    private async Task<bool> VerifyAsync(ApplicationUser user, VerifyMfaCommand request, CancellationToken ct) =>
        request.IsRecoveryCode
            ? (await users.RedeemTwoFactorRecoveryCodeAsync(user, request.Code.Trim())).Succeeded
            : await flow.VerifyTotpAsync(user, request.Code, ct);
}

// ---- Enrollment ---------------------------------------------------------------------------------------------

public sealed record MfaSetupResponse(string SharedKey, string AuthenticatorUri);

/// <summary>Starts authenticator enrollment, either mid-login (challenge token) or for a signed-in user.</summary>
[AllowAnonymousRequest]
public sealed record BeginMfaSetupCommand(string? MfaToken) : ICommand<MfaSetupResponse>;

public sealed class BeginMfaSetupHandler(UserManager<ApplicationUser> users, SignInFlow flow)
    : IRequestHandler<BeginMfaSetupCommand, MfaSetupResponse>
{
    private const string Issuer = "StrataLedger";

    public async Task<Result<MfaSetupResponse>> Handle(BeginMfaSetupCommand request, CancellationToken cancellationToken)
    {
        var resolved = await flow.ResolveMfaUserAsync(request.MfaToken);
        if (resolved.IsFailure)
        {
            return resolved.Error!;
        }

        var user = resolved.Value;
        if (user.TwoFactorEnabled)
        {
            return AuthErrors.MfaAlreadyEnabled;
        }

        await users.ResetAuthenticatorKeyAsync(user);
        var key = (await users.GetAuthenticatorKeyAsync(user))!;
        var label = Uri.EscapeDataString($"{Issuer}:{user.Email}");
        var uri = $"otpauth://totp/{label}?secret={key}&issuer={Uri.EscapeDataString(Issuer)}&digits=6&period=30";

        return new MfaSetupResponse(FormatKey(key), uri);
    }

    private static string FormatKey(string key) =>
        string.Join(' ', key.Chunk(4).Select(c => new string(c))).ToLowerInvariant();
}

public sealed record MfaConfirmResponse(IReadOnlyList<string> RecoveryCodes, SignInResult? SignIn);

[AllowAnonymousRequest]
public sealed record ConfirmMfaSetupCommand(string? MfaToken, string Code) : ICommand<MfaConfirmResponse>;

public sealed class ConfirmMfaSetupValidator : AbstractValidator<ConfirmMfaSetupCommand>
{
    public ConfirmMfaSetupValidator() => RuleFor(x => x.Code).NotEmpty().Length(6, 8);
}

public sealed class ConfirmMfaSetupHandler(
    UserManager<ApplicationUser> users,
    SignInFlow flow,
    IAuditWriter audit,
    IEmailOutbox outbox) : IRequestHandler<ConfirmMfaSetupCommand, MfaConfirmResponse>
{
    private const int RecoveryCodeCount = 10;

    public async Task<Result<MfaConfirmResponse>> Handle(ConfirmMfaSetupCommand request, CancellationToken cancellationToken)
    {
        var resolved = await flow.ResolveMfaUserAsync(request.MfaToken);
        if (resolved.IsFailure)
        {
            return resolved.Error!;
        }

        var user = resolved.Value;
        if (user.TwoFactorEnabled)
        {
            return AuthErrors.MfaAlreadyEnabled;
        }

        if (!await flow.VerifyTotpAsync(user, request.Code, cancellationToken))
        {
            return AuthErrors.InvalidMfaCode;
        }

        await users.SetTwoFactorEnabledAsync(user, true);
        var codes = (await users.GenerateNewTwoFactorRecoveryCodesAsync(user, RecoveryCodeCount))!.ToList();
        await audit.WriteSecurityEventAsync(AuditAction.MfaEnabled, user.Id, user.CompanyId, null, cancellationToken);
        await outbox.EnqueueAsync(user.CompanyId, user.Email!, user.FullName, EmailTemplate.MfaEnabled,
            new Dictionary<string, string> { ["name"] = user.FirstName }, cancellationToken);

        // Mid-login enrollment finishes the sign-in; a signed-in user enabling MFA keeps their session.
        var signIn = string.IsNullOrWhiteSpace(request.MfaToken) ? null : await flow.CompleteAsync(user, cancellationToken);
        return new MfaConfirmResponse(codes, signIn);
    }
}
