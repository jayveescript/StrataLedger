using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MyApp.Api.Infrastructure;
using MyApp.Application.Common.Services;
using MyApp.Application.Features.Account;
using MyApp.Application.Features.Auth;
using SignInResult = MyApp.Application.Features.Auth.SignInResult;

namespace MyApp.Api.Controllers;

public sealed record AuthResponse(SignInStep Step, string? AccessToken, DateTimeOffset? AccessTokenExpiresAt, string? MfaToken);

public sealed record MfaConfirmApiResponse(IReadOnlyList<string> RecoveryCodes, AuthResponse? SignIn);

/// <summary>
/// Sign-in endpoints. Access tokens are returned in the body (the SPA keeps them in memory); refresh tokens only ever
/// travel in an HttpOnly, Secure, SameSite=Strict cookie scoped to this controller's path.
/// </summary>
[Route("api/v1/auth")]
[EnableRateLimiting(RateLimitPolicies.Auth)]
public sealed class AuthController : ApiControllerBase
{
    public const string RefreshCookie = "sl_rt";
    public const string CsrfHeader = "X-MyApp-Csrf";
    private const string CookiePath = "/api/v1/auth";

    [HttpPost("login")]
    [AllowAnonymous]
    public Task<IActionResult> Login([FromBody] LoginCommand command) => Send(command, SignedIn);

    [HttpPost("mfa/verify")]
    [AllowAnonymous]
    public Task<IActionResult> VerifyMfa([FromBody] VerifyMfaCommand command) => Send(command, SignedIn);

    [HttpPost("mfa/setup")]
    [AllowAnonymous]
    public Task<IActionResult> BeginMfaSetup([FromBody] BeginMfaSetupCommand command) => Send(command);

    [HttpPost("mfa/confirm")]
    [AllowAnonymous]
    public Task<IActionResult> ConfirmMfaSetup([FromBody] ConfirmMfaSetupCommand command) =>
        Send(command, r => Ok(new MfaConfirmApiResponse(r.RecoveryCodes, r.SignIn is null ? null : ToResponse(r.SignIn))));

    /// <summary>Rotates the refresh cookie and returns a new access token. Requires the CSRF header.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Session)]
    public async Task<IActionResult> Refresh()
    {
        if (!Request.Headers.ContainsKey(CsrfHeader))
        {
            return ToProblem(Application.Common.Results.Error.Forbidden("Missing CSRF header."));
        }

        var result = await Dispatch(new RefreshSessionCommand(Request.Cookies[RefreshCookie] ?? string.Empty));
        return result.Match(
            tokens =>
            {
                SetRefreshCookie(tokens);
                return Ok(new AuthResponse(SignInStep.Completed, tokens.AccessToken, tokens.AccessTokenExpiresAt, null));
            },
            error =>
            {
                ClearRefreshCookie();
                return ToProblem(error);
            });
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Session)]
    public async Task<IActionResult> Logout()
    {
        await Dispatch(new LogoutCommand(Request.Cookies[RefreshCookie]));
        ClearRefreshCookie();
        return NoContent();
    }

    [HttpPost("password/forgot")]
    [AllowAnonymous]
    public Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCommand command) => Send(command, _ => Accepted());

    [HttpPost("password/reset")]
    [AllowAnonymous]
    public Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command) => SendNoContent(command);

    [HttpGet("invitations/{token}")]
    [AllowAnonymous]
    public Task<IActionResult> GetInvitation(string token) => Send(new GetInvitationQuery(token));

    [HttpPost("invitations/accept")]
    [AllowAnonymous]
    public Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationCommand command) => Send(command, SignedIn);

    [HttpGet("me")]
    [Authorize]
    [DisableRateLimiting]
    public Task<IActionResult> Me() => Send(new GetMeQuery());

    private IActionResult SignedIn(SignInResult result) => Ok(ToResponse(result));

    private AuthResponse ToResponse(SignInResult result)
    {
        if (result.Tokens is { } tokens)
        {
            SetRefreshCookie(tokens);
        }

        return new AuthResponse(result.Step, result.Tokens?.AccessToken, result.Tokens?.AccessTokenExpiresAt, result.MfaToken);
    }

    private void SetRefreshCookie(AuthTokens tokens) =>
        Response.Cookies.Append(RefreshCookie, tokens.RefreshToken, CookieOptions(tokens.RefreshTokenExpiresAt));

    private void ClearRefreshCookie() => Response.Cookies.Delete(RefreshCookie, CookieOptions(null));

    private static CookieOptions CookieOptions(DateTimeOffset? expires) => new()
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Path = CookiePath,
        Expires = expires,
        IsEssential = true,
    };
}
