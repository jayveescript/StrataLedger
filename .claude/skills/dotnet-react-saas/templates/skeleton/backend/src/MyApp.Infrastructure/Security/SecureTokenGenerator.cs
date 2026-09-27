using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using MyApp.Application.Common.Services;

namespace MyApp.Infrastructure.Security;

public sealed class SecureTokenGenerator : ISecureTokenGenerator
{
    public string Generate(int bytes = 32) => WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(bytes));

    public string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
