using System.Net;
using System.Net.Http.Json;
using StrataLedger.Domain.Enums;
using StrataLedger.IntegrationTests.Infrastructure;

namespace StrataLedger.IntegrationTests;

public sealed class AuthTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Protected_endpoints_require_a_bearer_token()
    {
        var response = await factory.CreateClient().GetAsync(new Uri("/api/v1/strata-plans", UriKind.Relative));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Security_headers_are_sent()
    {
        var response = await factory.CreateClient().GetAsync(new Uri("/health/live", UriKind.Relative));
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());
    }

    [Fact]
    public async Task Staff_without_mfa_must_enroll_before_getting_tokens()
    {
        var company = await factory.CreateCompanyAsync();
        var manager = await factory.CreateUserAsync(company.Id, UserRole.StrataManager, enableMfa: false);
        var client = new ApiClient(factory.CreateClient());

        var login = await (await client.PostAsync("/api/v1/auth/login", new { email = manager.Email, password = manager.Password }))
            .Content.ReadFromJsonAsync<AuthResponse>(ApiClient.Json);

        Assert.Equal("MfaEnrollmentRequired", login!.Step);
        Assert.Null(login.AccessToken);
        Assert.Null(client.RefreshCookie);

        var setup = await (await client.PostAsync("/api/v1/auth/mfa/setup", new { mfaToken = login.MfaToken }))
            .Content.ReadFromJsonAsync<Dictionary<string, string>>(ApiClient.Json);
        var confirm = await client.PostAsync("/api/v1/auth/mfa/confirm", new { mfaToken = login.MfaToken, code = Totp.Code(setup!["sharedKey"]) });

        Assert.Equal(HttpStatusCode.OK, confirm.StatusCode);
        Assert.NotNull(client.RefreshCookie);
    }

    [Fact]
    public async Task Totp_codes_cannot_be_replayed()
    {
        var company = await factory.CreateCompanyAsync();
        var admin = await factory.CreateUserAsync(company.Id, UserRole.CompanyAdmin);
        var code = Totp.Code(admin.AuthenticatorKey!);

        async Task<HttpStatusCode> Attempt()
        {
            var client = new ApiClient(factory.CreateClient());
            var login = await (await client.PostAsync("/api/v1/auth/login", new { email = admin.Email, password = admin.Password }))
                .Content.ReadFromJsonAsync<AuthResponse>(ApiClient.Json);
            return (await client.PostAsync("/api/v1/auth/mfa/verify", new { mfaToken = login!.MfaToken, code })).StatusCode;
        }

        Assert.Equal(HttpStatusCode.OK, await Attempt());
        Assert.Equal(HttpStatusCode.Unauthorized, await Attempt());
    }

    [Fact]
    public async Task Repeated_bad_passwords_lock_the_account()
    {
        var company = await factory.CreateCompanyAsync();
        var owner = await factory.CreateUserAsync(company.Id, UserRole.Owner, enableMfa: false);
        var client = new ApiClient(factory.CreateClient());

        for (var i = 0; i < 5; i++)
        {
            await client.PostAsync("/api/v1/auth/login", new { email = owner.Email, password = "Wrong-Password-123!" });
        }

        var withCorrectPassword = await client.PostAsync("/api/v1/auth/login", new { email = owner.Email, password = owner.Password });
        Assert.Equal(HttpStatusCode.Unauthorized, withCorrectPassword.StatusCode);
    }

    [Fact]
    public async Task Unknown_email_and_wrong_password_are_indistinguishable()
    {
        var company = await factory.CreateCompanyAsync();
        var owner = await factory.CreateUserAsync(company.Id, UserRole.Owner, enableMfa: false);
        var client = new ApiClient(factory.CreateClient());

        var unknown = await client.PostAsync("/api/v1/auth/login", new { email = "nobody@nowhere.test", password = "Whatever-123!x" });
        var wrong = await client.PostAsync("/api/v1/auth/login", new { email = owner.Email, password = "Whatever-123!x" });

        Assert.Equal(unknown.StatusCode, wrong.StatusCode);
        Assert.Equal(await unknown.Content.ReadAsStringAsync().ContinueWith(t => t.Result.Split("traceId")[0], TaskScheduler.Default),
            await wrong.Content.ReadAsStringAsync().ContinueWith(t => t.Result.Split("traceId")[0], TaskScheduler.Default));
    }

    [Fact]
    public async Task Refresh_tokens_rotate_and_replay_after_grace_revokes_the_family()
    {
        var company = await factory.CreateCompanyAsync();
        var owner = await factory.CreateUserAsync(company.Id, UserRole.Owner, enableMfa: false);
        var client = await ApiClient.SignInAsync(factory, owner);
        var original = client.RefreshCookie!;

        Assert.Equal(HttpStatusCode.OK, (await client.RefreshAsync()).StatusCode);
        var rotated = client.RefreshCookie!;
        Assert.NotEqual(original, rotated);

        // Simulate the grace period elapsing, then replay the stolen original token.
        await factory.InPlatformScopeAsync(async (_, db) =>
        {
            foreach (var t in db.RefreshTokens.Where(t => t.UserId == owner.Id && t.RevokedAt != null))
            {
                db.Entry(t).Property(x => x.RevokedAt).CurrentValue = DateTimeOffset.UtcNow.AddMinutes(-5);
            }

            return await db.SaveChangesAsync();
        });

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.RefreshAsync(original)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.RefreshAsync(rotated)).StatusCode);
    }

    [Fact]
    public async Task Refresh_requires_the_csrf_header()
    {
        var company = await factory.CreateCompanyAsync();
        var owner = await factory.CreateUserAsync(company.Id, UserRole.Owner, enableMfa: false);
        var client = await ApiClient.SignInAsync(factory, owner);

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        request.Headers.Add("Cookie", $"sl_rt={client.RefreshCookie}");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.Http.SendAsync(request)).StatusCode);
    }

    [Fact]
    public async Task Changing_password_revokes_existing_access_tokens_and_rejects_reuse()
    {
        var company = await factory.CreateCompanyAsync();
        var owner = await factory.CreateUserAsync(company.Id, UserRole.Owner, enableMfa: false);
        var client = await ApiClient.SignInAsync(factory, owner);

        var reuse = await client.PostAsync("/api/v1/account/password", new { currentPassword = owner.Password, newPassword = owner.Password + "x" });
        Assert.Equal(HttpStatusCode.NoContent, reuse.StatusCode);

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/auth/me")).StatusCode);

        var relogged = await ApiClient.SignInAsync(factory, owner with { Password = owner.Password + "x" });
        var back = await relogged.PostAsync("/api/v1/account/password", new { currentPassword = owner.Password + "x", newPassword = owner.Password });
        Assert.Equal(HttpStatusCode.BadRequest, back.StatusCode);
        Assert.Contains("reuse", await back.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
    }
}
