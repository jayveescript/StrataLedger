using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Services;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;

namespace MyApp.Application.Features.Auth;

public enum SignInStep
{
    Completed = 1,
    MfaRequired,
    MfaEnrollmentRequired,
}

public sealed record SignInResult(SignInStep Step, AuthTokens? Tokens, string? MfaToken);

/// <summary>Shared sign-in steps used by login, MFA verification and invitation acceptance.</summary>
public sealed class SignInFlow(
    UserManager<ApplicationUser> users,
    IRepository<Tenant> tenants,
    IAuthSessionService sessions,
    IMfaChallengeService challenges,
    ICurrentUser currentUser,
    IDistributedCache cache,
    TimeProvider clock)
{
    public async Task<bool> CanSignInAsync(ApplicationUser user, CancellationToken ct) =>
        user.IsActive
        && (user.TenantId is not { } tenantId
            || await tenants.Query().AnyAsync(c => c.Id == tenantId && c.Status == TenantStatus.Active, ct));

    /// <summary>Decides the next step once the password (or invitation) has been verified.</summary>
    public async Task<SignInResult> ContinueAfterPasswordAsync(ApplicationUser user, CancellationToken ct)
    {
        var step = (user.TwoFactorEnabled, user.RequiresMfa) switch
        {
            (true, _) => SignInStep.MfaRequired,
            (false, true) => SignInStep.MfaEnrollmentRequired,
            _ => SignInStep.Completed,
        };

        return step == SignInStep.Completed
            ? await CompleteAsync(user, ct)
            : new SignInResult(step, null, challenges.Create(user.Id));
    }

    public async Task<SignInResult> CompleteAsync(ApplicationUser user, CancellationToken ct)
    {
        user.LastLoginAt = clock.GetUtcNow();
        await users.UpdateAsync(user);
        var tokens = await sessions.StartSessionAsync(user, ct);
        return new SignInResult(SignInStep.Completed, tokens, null);
    }

    /// <summary>Resolves the user for an MFA step from a challenge token, or from the signed-in user.</summary>
    public async Task<Result<ApplicationUser>> ResolveMfaUserAsync(string? challengeToken)
    {
        var userId = string.IsNullOrWhiteSpace(challengeToken) ? currentUser.UserId : challenges.Validate(challengeToken);
        var user = userId is { } id ? await users.FindByIdAsync(id.ToString()) : null;
        return user is { IsActive: true } ? user : AuthErrors.InvalidChallenge;
    }

    /// <summary>Verifies a TOTP code and blocks replay of the same code within its validity window.</summary>
    public async Task<bool> VerifyTotpAsync(ApplicationUser user, string code, CancellationToken ct)
    {
        var normalized = code.Replace(" ", string.Empty, StringComparison.Ordinal).Replace("-", string.Empty, StringComparison.Ordinal);
        var replayKey = $"mfa:used:{user.Id}:{normalized}";
        if (await cache.GetStringAsync(replayKey, ct) is not null)
        {
            return false;
        }

        var valid = await users.VerifyTwoFactorTokenAsync(user, users.Options.Tokens.AuthenticatorTokenProvider, normalized);
        if (valid)
        {
            await cache.SetStringAsync(replayKey, "1",
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(3) }, ct);
        }

        return valid;
    }
}
