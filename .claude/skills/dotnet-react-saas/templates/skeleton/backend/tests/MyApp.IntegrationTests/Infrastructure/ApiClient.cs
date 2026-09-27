using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MyApp.IntegrationTests.Infrastructure;

public sealed record AuthResponse(string Step, string? AccessToken, DateTimeOffset? AccessTokenExpiresAt, string? MfaToken);

/// <summary>Thin HTTP helper that signs in through the real endpoints (password + TOTP) and tracks the refresh cookie.</summary>
public sealed class ApiClient(HttpClient http)
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };

    public HttpClient Http { get; } = http;
    public string? RefreshCookie { get; private set; }

    public static async Task<ApiClient> SignInAsync(ApiFactory factory, TestUser user)
    {
        var client = new ApiClient(factory.CreateClient());
        var login = await client.PostAsync("/api/v1/auth/login", new { email = user.Email, password = user.Password });
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>(Json);

        if (auth!.Step == "MfaRequired")
        {
            var verify = await client.PostAsync("/api/v1/auth/mfa/verify", new { mfaToken = auth.MfaToken, code = Totp.Code(user.AuthenticatorKey!) });
            verify.EnsureSuccessStatusCode();
            auth = await verify.Content.ReadFromJsonAsync<AuthResponse>(Json);
        }

        client.UseToken(auth!.AccessToken!);
        return client;
    }

    public void UseToken(string token) => Http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    public async Task<HttpResponseMessage> PostAsync(string url, object? body = null)
    {
        var response = await Http.PostAsJsonAsync(url, body ?? new { }, Json);
        CaptureCookie(response);
        return response;
    }

    public Task<HttpResponseMessage> PutAsync(string url, object body) => Http.PutAsJsonAsync(url, body, Json);

    public Task<HttpResponseMessage> GetAsync(string url) => Http.GetAsync(new Uri(url, UriKind.Relative));

    public async Task<T> GetJsonAsync<T>(string url)
    {
        var response = await GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<T>(Json))!;
    }

    /// <summary>Calls /auth/refresh with an explicit cookie value (TestServer is plain HTTP, so Secure cookies are sent by hand).</summary>
    public async Task<HttpResponseMessage> RefreshAsync(string? cookie = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        request.Headers.Add("Cookie", $"sl_rt={cookie ?? RefreshCookie}");
        request.Headers.Add("X-MyApp-Csrf", "1");
        var response = await Http.SendAsync(request);
        CaptureCookie(response);
        return response;
    }

    private void CaptureCookie(HttpResponseMessage response)
    {
        var cookie = response.Headers.TryGetValues("Set-Cookie", out var values)
            ? values.FirstOrDefault(v => v.StartsWith("sl_rt=", StringComparison.Ordinal))
            : null;
        var value = cookie?.Split(';')[0]["sl_rt=".Length..];
        if (!string.IsNullOrEmpty(value))
        {
            RefreshCookie = value;
        }
    }
}
