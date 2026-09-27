using Microsoft.AspNetCore.DataProtection;
using MyApp.Application.Common.Services;

namespace MyApp.Infrastructure.Identity;

/// <summary>Encrypted, signed, 5-minute token proving the password step succeeded for a user.</summary>
public sealed class MfaChallengeService(IDataProtectionProvider provider, TimeProvider clock) : IMfaChallengeService
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(5);
    private readonly ITimeLimitedDataProtector _protector =
        provider.CreateProtector("MyApp.MfaChallenge.v1").ToTimeLimitedDataProtector();

    public string Create(Guid userId) => _protector.Protect(userId.ToString("N"), clock.GetUtcNow().Add(Lifetime));

    public Guid? Validate(string challengeToken)
    {
        try
        {
            return Guid.TryParseExact(_protector.Unprotect(challengeToken), "N", out var id) ? id : null;
        }
        catch (System.Security.Cryptography.CryptographicException)
        {
            return null;
        }
    }
}
