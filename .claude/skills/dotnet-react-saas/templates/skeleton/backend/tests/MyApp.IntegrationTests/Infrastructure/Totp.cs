using System.Buffers.Binary;
using System.Security.Cryptography;

namespace MyApp.IntegrationTests.Infrastructure;

/// <summary>RFC 6238 code generator, the same algorithm an authenticator app uses.</summary>
public static class Totp
{
    private const string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    public static string Code(string base32Secret, int stepOffset = 0)
    {
        var key = FromBase32(base32Secret.Replace(" ", string.Empty, StringComparison.Ordinal).ToUpperInvariant());
        var counter = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30 + stepOffset;
        Span<byte> message = stackalloc byte[8];
        BinaryPrimitives.WriteInt64BigEndian(message, counter);
#pragma warning disable CA5350 // RFC 6238 specifies HMAC-SHA1
        var hash = HMACSHA1.HashData(key, message);
#pragma warning restore CA5350
        var offset = hash[^1] & 0x0F;
        var binary = BinaryPrimitives.ReadInt32BigEndian(hash.AsSpan(offset)) & 0x7FFFFFFF;
        return (binary % 1_000_000).ToString("D6", System.Globalization.CultureInfo.InvariantCulture);
    }

    private static byte[] FromBase32(string input)
    {
        var bits = string.Concat(input.TrimEnd('=').Select(c => Convert.ToString(Alphabet.IndexOf(c), 2).PadLeft(5, '0')));
        return Enumerable.Range(0, bits.Length / 8).Select(i => Convert.ToByte(bits.Substring(i * 8, 8), 2)).ToArray();
    }
}
