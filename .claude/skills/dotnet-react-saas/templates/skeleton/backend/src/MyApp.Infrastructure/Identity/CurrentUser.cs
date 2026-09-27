using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;

namespace MyApp.Infrastructure.Identity;

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true && UserId.HasValue;

    public Guid? UserId => ParseGuid(AppClaims.Subject);

    public Guid? TenantId => ParseGuid(AppClaims.TenantId);

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
    public const string TenantId = "tenant_id";
    public const string SecurityStamp = "sstamp";
    public const string TenantSessionVersion = "tsv";
    public const string Email = "email";
    public const string Name = "name";
    public const string Role = "role";
}
