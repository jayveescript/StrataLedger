using System.Security.Cryptography;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using StrataLedger.Infrastructure.Options;

namespace StrataLedger.Infrastructure.Identity;

/// <summary>
/// RS256 signing key. Production must supply a PEM via configuration/secret store; Development generates one and
/// persists it so tokens survive restarts.
/// </summary>
public sealed class JwtKeyProvider
{
    public JwtKeyProvider(IOptions<JwtOptions> options, IHostEnvironment environment)
    {
        var rsa = RSA.Create();
        var pem = options.Value.SigningKeyPem;

        if (string.IsNullOrWhiteSpace(pem))
        {
            if (!environment.IsDevelopment() && !environment.IsEnvironment("Testing"))
            {
                throw new InvalidOperationException("Jwt:SigningKeyPem must be configured outside Development.");
            }

            pem = LoadOrCreateDevKey(options.Value.DevKeyPath, environment);
        }

        rsa.ImportFromPem(pem);
        SigningKey = new RsaSecurityKey(rsa) { KeyId = Convert.ToHexString(SHA256.HashData(rsa.ExportRSAPublicKey()))[..16] };
        Credentials = new SigningCredentials(SigningKey, SecurityAlgorithms.RsaSha256);
    }

    public RsaSecurityKey SigningKey { get; }
    public SigningCredentials Credentials { get; }

    private static string LoadOrCreateDevKey(string path, IHostEnvironment environment)
    {
        var fullPath = Path.IsPathRooted(path) ? path : Path.Combine(environment.ContentRootPath, path);
        if (File.Exists(fullPath))
        {
            return File.ReadAllText(fullPath);
        }

        using var rsa = RSA.Create(2048);
        var pem = rsa.ExportRSAPrivateKeyPem();
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        File.WriteAllText(fullPath, pem);
        return pem;
    }
}
