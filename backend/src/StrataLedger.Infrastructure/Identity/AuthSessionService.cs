using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Services;
using StrataLedger.Application.Features.Auth;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;
using StrataLedger.Infrastructure.Options;
using StrataLedger.Infrastructure.Persistence;

namespace StrataLedger.Infrastructure.Identity;

public sealed class AuthSessionService(
    AppDbContext db,
    UserManager<ApplicationUser> users,
    JwtKeyProvider keys,
    IOptions<JwtOptions> options,
    ISecureTokenGenerator tokens,
    ICurrentUser currentUser,
    ISessionValidator sessionValidator,
    IAuditWriter audit,
    TimeProvider clock) : IAuthSessionService
{
    // Concurrent refreshes from two tabs may present the same token; don't treat that as theft.
    private static readonly TimeSpan ReuseGracePeriod = TimeSpan.FromSeconds(20);
    private const string RotatedReason = "rotated";

    private readonly JwtOptions _options = options.Value;
    private static readonly JwtSecurityTokenHandler Handler = new() { MapInboundClaims = false, OutboundClaimTypeMap = new Dictionary<string, string>() };

    public Task<AuthTokens> StartSessionAsync(ApplicationUser user, CancellationToken cancellationToken = default) =>
        IssueAsync(user, Guid.CreateVersion7(), null, cancellationToken);

    public async Task<Result<AuthTokens>> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var hash = tokens.Hash(refreshToken);
        var existing = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
        if (existing is null)
        {
            return AuthErrors.InvalidRefreshToken;
        }

        if (!existing.IsActive(now))
        {
            await HandleInactiveTokenAsync(existing, now, cancellationToken);
            return AuthErrors.InvalidRefreshToken;
        }

        var user = await users.FindByIdAsync(existing.UserId.ToString());
        if (user is null || !await CanContinueAsync(user, cancellationToken))
        {
            existing.Revoke(now, "user unavailable");
            await db.SaveChangesAsync(cancellationToken);
            return AuthErrors.InvalidRefreshToken;
        }

        return await IssueAsync(user, existing.FamilyId, existing, cancellationToken);
    }

    public async Task EndSessionAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var hash = tokens.Hash(refreshToken);
        var token = await db.RefreshTokens.AsNoTracking().FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
        if (token is not null)
        {
            await RevokeFamilyAsync(token.FamilyId, "logout", cancellationToken);
        }
    }

    public async Task<int> RevokeAllForUserAsync(Guid userId, string reason, CancellationToken cancellationToken = default)
    {
        var now = clock.GetUtcNow();
        var active = await db.RefreshTokens.Where(t => t.UserId == userId && t.RevokedAt == null).ToListAsync(cancellationToken);
        active.ForEach(t => t.Revoke(now, reason));

        // Rotating the security stamp invalidates access tokens that are still within their lifetime.
        var user = await users.FindByIdAsync(userId.ToString());
        if (user is not null)
        {
            await users.UpdateSecurityStampAsync(user);
        }

        await db.SaveChangesAsync(cancellationToken);
        await sessionValidator.InvalidateUserAsync(userId, cancellationToken);
        return active.Count;
    }

    private async Task<AuthTokens> IssueAsync(ApplicationUser user, Guid familyId, RefreshToken? rotating, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var raw = tokens.Generate(48);
        var refresh = new RefreshToken(user.Id, familyId, tokens.Hash(raw), now, now.AddDays(_options.RefreshTokenDays),
            currentUser.IpAddress, currentUser.UserAgent);
        db.RefreshTokens.Add(refresh);
        rotating?.Revoke(now, RotatedReason, refresh.Id);

        var companyVersion = user.CompanyId is { } companyId
            ? await db.Companies.Where(c => c.Id == companyId).Select(c => c.SessionVersion).FirstAsync(ct)
            : 0;

        await db.SaveChangesAsync(ct);

        var accessExpires = now.AddMinutes(_options.AccessTokenMinutes);
        return new AuthTokens(CreateAccessToken(user, companyVersion, now, accessExpires), accessExpires, raw, refresh.ExpiresAt);
    }

    private string CreateAccessToken(ApplicationUser user, int companyVersion, DateTimeOffset now, DateTimeOffset expires)
    {
        var claims = new List<Claim>
        {
            new(AppClaims.Subject, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(AppClaims.Email, user.Email!),
            new(AppClaims.Name, user.FullName),
            new(AppClaims.Role, user.Role.ToString()),
            new(AppClaims.SecurityStamp, user.SecurityStamp!),
            new(AppClaims.CompanySessionVersion, companyVersion.ToString()),
        };

        if (user.CompanyId is { } companyId)
        {
            claims.Add(new Claim(AppClaims.CompanyId, companyId.ToString()));
        }

        var token = new JwtSecurityToken(_options.Issuer, _options.Audience, claims, now.UtcDateTime, expires.UtcDateTime,
            keys.Credentials);
        return Handler.WriteToken(token);
    }

    private async Task<bool> CanContinueAsync(ApplicationUser user, CancellationToken ct) =>
        user.IsActive
        && !await users.IsLockedOutAsync(user)
        && (user.CompanyId is not { } companyId
            || await db.Companies.AnyAsync(c => c.Id == companyId && c.Status == CompanyStatus.Active, ct));

    private async Task HandleInactiveTokenAsync(RefreshToken token, DateTimeOffset now, CancellationToken ct)
    {
        var replayedAfterRotation = token.RevokedReason == RotatedReason && now - token.RevokedAt > ReuseGracePeriod;
        if (!replayedAfterRotation)
        {
            return;
        }

        // A rotated token came back: assume it was stolen and kill the whole chain.
        await RevokeFamilyAsync(token.FamilyId, "reuse detected", ct);
        await audit.WriteSecurityEventAsync(AuditAction.SessionRevoked, token.UserId, null, "refresh token reuse detected", ct);
    }

    private async Task RevokeFamilyAsync(Guid familyId, string reason, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var family = await db.RefreshTokens.Where(t => t.FamilyId == familyId && t.RevokedAt == null).ToListAsync(ct);
        family.ForEach(t => t.Revoke(now, reason));
        await db.SaveChangesAsync(ct);
    }
}
