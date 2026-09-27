using MyApp.Application.Common.Results;

namespace MyApp.Application.Features.Auth;

public static class AuthErrors
{
    /// <summary>Deliberately identical for unknown email, wrong password, locked, inactive or suspended accounts.</summary>
    public static readonly Error InvalidCredentials =
        new(ErrorType.Unauthorized, "auth.invalid_credentials", "Invalid email or password, or the account is locked.");

    public static readonly Error InvalidMfaCode =
        new(ErrorType.Unauthorized, "auth.invalid_mfa_code", "The verification code is invalid or has expired.");

    public static readonly Error InvalidChallenge =
        new(ErrorType.Unauthorized, "auth.invalid_challenge", "Your sign-in session has expired. Please sign in again.");

    public static readonly Error InvalidRefreshToken =
        new(ErrorType.Unauthorized, "auth.invalid_refresh_token", "Your session has expired. Please sign in again.");

    public static readonly Error InvalidInvitation =
        new(ErrorType.NotFound, "invitation.invalid", "This invitation is invalid, already used or has expired.");

    public static readonly Error InvalidResetToken =
        Error.Validation("auth.invalid_reset_token", "This password reset link is invalid or has expired.");

    public static readonly Error MfaAlreadyEnabled =
        Error.Conflict("auth.mfa_already_enabled", "Two-factor authentication is already enabled.");

    public static readonly Error MfaRequiredForRole =
        Error.Validation("auth.mfa_required", "Two-factor authentication is mandatory for staff accounts.");
}
