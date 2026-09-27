using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using MyApp.Application.Common.Services;

namespace MyApp.Infrastructure.Security;

/// <summary>
/// Have I Been Pwned range API. Only the first 5 hex chars of the SHA-1 leave the server (k-anonymity).
/// Fails open (logs and allows) so an outage there cannot block sign-ups.
/// </summary>
public sealed partial class PwnedPasswordsChecker(HttpClient http, ILogger<PwnedPasswordsChecker> logger) : IPasswordBreachChecker
{
    public async Task<int> GetBreachCountAsync(string password, CancellationToken cancellationToken = default)
    {
#pragma warning disable CA5350 // SHA-1 is mandated by the HIBP range protocol; it is not used for security here.
        var hash = Convert.ToHexString(SHA1.HashData(Encoding.UTF8.GetBytes(password)));
#pragma warning restore CA5350
        var prefix = hash[..5];
        var suffix = hash[5..];

        try
        {
            var body = await http.GetStringAsync(new Uri($"range/{prefix}", UriKind.Relative), cancellationToken);
            return body.Split('\n')
                .Select(line => line.Trim().Split(':'))
                .Where(parts => parts.Length == 2 && parts[0].Equals(suffix, StringComparison.OrdinalIgnoreCase))
                .Select(parts => int.TryParse(parts[1], out var count) ? count : 0)
                .FirstOrDefault();
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            LogUnavailable(logger, ex.Message);
            return 0;
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Breached-password check unavailable ({Reason}); allowing password")]
    private static partial void LogUnavailable(ILogger logger, string reason);
}
