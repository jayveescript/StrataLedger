namespace StrataLedger.Infrastructure.Options;

public sealed class JwtOptions
{
    public const string Section = "Jwt";

    public string Issuer { get; set; } = "strataledger";
    public string Audience { get; set; } = "strataledger-web";

    /// <summary>PEM-encoded RSA private key. Outside Development this or <see cref="SigningKeyPath"/> is required.</summary>
    public string? SigningKeyPem { get; set; }

    /// <summary>Path to a PEM file (e.g. a Docker/Kubernetes secret mount).</summary>
    public string? SigningKeyPath { get; set; }

    /// <summary>Development only: where an auto-generated key is persisted.</summary>
    public string DevKeyPath { get; set; } = "keys/jwt-dev.pem";

    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 14;
}

public sealed class AppUrlOptions
{
    public const string Section = "App";

    /// <summary>Public origin of the React app, used for links in emails and CORS.</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";

    /// <summary>Public origin of the API, used for asset links in emails.</summary>
    public string ApiBaseUrl { get; set; } = "http://localhost:5080";
}

public sealed class SmtpOptions
{
    public const string Section = "Smtp";

    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1025;
    public bool UseStartTls { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string FromAddress { get; set; } = "no-reply@strataledger.local";
    public string FromName { get; set; } = "StrataLedger";
}

public sealed class SeedOptions
{
    public const string Section = "Seed";

    public string? SuperAdminEmail { get; set; }
    public string? SuperAdminPassword { get; set; }
    public bool DemoData { get; set; }
}

public sealed class SecurityOptions
{
    public const string Section = "Security";

    /// <summary>Check new passwords against the Have I Been Pwned k-anonymity API.</summary>
    public bool BreachedPasswordCheck { get; set; } = true;

    public int PasswordHistoryDepth { get; set; } = 5;
}
