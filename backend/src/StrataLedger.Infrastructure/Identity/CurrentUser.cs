using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Infrastructure.Identity;

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true && UserId.HasValue;

    public Guid? UserId => ParseGuid(AppClaims.Subject);

    public Guid? CompanyId => ParseGuid(AppClaims.CompanyId);

    public UserRole? Role => Enum.TryParse<UserRole>(Principal?.FindFirstValue(AppClaims.Role), out var role) ? role : null;

    public string? IpAddress => accessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public string? UserAgent
    {
        get
        {
            var ua = accessor.HttpContext?.Request.Headers.UserAgent.ToString();
            return string.IsNullOrEmpty(ua) ? null : ua[..Math.Min(ua.Length, 512)];
        }
    }

    private Guid? ParseGuid(string claim) =>
        Guid.TryParse(Principal?.FindFirstValue(claim), out var id) ? id : null;
}

public static class AppClaims
{
    public const string Subject = "sub";
    public const string CompanyId = "company_id";
    public const string SecurityStamp = "sstamp";
    public const string CompanySessionVersion = "csv";
    public const string Email = "email";
    public const string Name = "name";
    public const string Role = "role";
}
