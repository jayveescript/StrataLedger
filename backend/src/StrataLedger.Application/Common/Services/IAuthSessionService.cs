using StrataLedger.Application.Common.Results;
using StrataLedger.Domain.Identity;

namespace StrataLedger.Application.Common.Services;

public sealed record AuthTokens(string AccessToken, DateTimeOffset AccessTokenExpiresAt, string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt);

/// <summary>Issues access tokens and manages the rotating refresh-token families behind them.</summary>
public interface IAuthSessionService
{
    Task<AuthTokens> StartSessionAsync(ApplicationUser user, CancellationToken cancellationToken = default);

    /// <summary>Rotates a refresh token. Replaying an already-used token revokes the whole family.</summary>
    Task<Result<AuthTokens>> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default);

    Task EndSessionAsync(string refreshToken, CancellationToken cancellationToken = default);

    Task<int> RevokeAllForUserAsync(Guid userId, string reason, CancellationToken cancellationToken = default);
}

/// <summary>Short-lived, tamper-proof token that carries a user between the password step and the MFA step.</summary>
public interface IMfaChallengeService
{
    string Create(Guid userId);
    Guid? Validate(string challengeToken);
}

/// <summary>Cached lookups used on every authenticated request to reject revoked sessions instantly.</summary>
public interface ISessionValidator
{
    Task<bool> IsValidAsync(Guid userId, string securityStamp, Guid? companyId, int companySessionVersion,
        CancellationToken cancellationToken = default);

    Task InvalidateUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task InvalidateCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
}
