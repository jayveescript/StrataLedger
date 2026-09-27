using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;
using MyApp.IntegrationTests.Infrastructure;

namespace MyApp.IntegrationTests;

public sealed class InvitationTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Upload_preview_validates_every_row_without_side_effects()
    {
        var tenant = await factory.CreateTenantAsync();
        var manager = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(tenant.Id, UserRole.Manager));
        var csv = "email,first_name,last_name,role\n" +
                  "a@test.local,Ann,Member,Member\n" +
                  "b@test.local,Bob,Boss,Tenant Admin\n" +
                  "not-an-email,C,D,Member\n";

        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(Encoding.UTF8.GetBytes(csv));
        file.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        form.Add(file, "file", "list.csv");
        var response = await manager.Http.PostAsync(new Uri("/api/v1/tenant/invitations/preview", UriKind.Relative), form);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var preview = await response.Content.ReadFromJsonAsync<JsonElement>(ApiClient.Json);
        Assert.Equal(1, preview.GetProperty("validRows").GetInt32()); // managers may only invite members
        var pending = await factory.InPlatformScopeAsync((_, db) => db.Invitations.IgnoreQueryFilters().CountAsync(i => i.TenantId == tenant.Id));
        Assert.Equal(0, pending);
    }

    [Fact]
    public async Task Invitation_is_single_use_and_creates_a_working_account()
    {
        var tenant = await factory.CreateTenantAsync();
        var admin = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(tenant.Id, UserRole.TenantAdmin));

        var send = await admin.PostAsync("/api/v1/tenant/invitations", new
        {
            fileName = "list.csv",
            rows = new[] { new { email = "newmember@test.local", firstName = "New", lastName = "Member", role = "Member" } },
        });
        Assert.Equal(HttpStatusCode.OK, send.StatusCode);

        // The raw token only exists in the email; issue a known one the same way the service does.
        var token = await factory.InPlatformScopeAsync(async (sp, db) =>
        {
            var tokens = sp.GetRequiredService<ISecureTokenGenerator>();
            var raw = tokens.Generate();
            var invitation = await db.Invitations.IgnoreQueryFilters().SingleAsync(i => i.Email == "newmember@test.local");
            invitation.Reissue(tokens.Hash(raw), DateTimeOffset.UtcNow.AddHours(1));
            await db.SaveChangesAsync();
            return raw;
        });

        var anonymous = new ApiClient(factory.CreateClient());
        var accept = new { token, firstName = "Nina", lastName = "Owens", password = "Harbour-Lights-2026!q" };
        var accepted = await anonymous.PostAsync("/api/v1/auth/invitations/accept", accept);
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.PostAsync("/api/v1/auth/invitations/accept", accept)).StatusCode);

        var member = new TestUser(Guid.Empty, "newmember@test.local", "Harbour-Lights-2026!q", null, tenant.Id);
        var me = await (await ApiClient.SignInAsync(factory, member)).GetJsonAsync<JsonElement>("/api/v1/auth/me");
        Assert.Equal("Member", me.GetProperty("role").GetString());
        Assert.Equal(tenant.Id, me.GetProperty("tenant").GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task Weak_or_personal_passwords_are_rejected_on_acceptance()
    {
        var tenant = await factory.CreateTenantAsync();
        var token = await factory.InPlatformScopeAsync(async (sp, db) =>
        {
            var tokens = sp.GetRequiredService<ISecureTokenGenerator>();
            var raw = tokens.Generate();
            db.Invitations.Add(new Invitation(tenant.Id, null, "weak@test.local", "Wendy", "Weak", UserRole.Member,
                tokens.Hash(raw), DateTimeOffset.UtcNow.AddHours(1)));
            await db.SaveChangesAsync();
            return raw;
        });

        var client = new ApiClient(factory.CreateClient());
        var weak = await client.PostAsync("/api/v1/auth/invitations/accept", new { token, firstName = "Wendy", lastName = "Weak", password = "password" });
        var personal = await client.PostAsync("/api/v1/auth/invitations/accept", new { token, firstName = "Wendy", lastName = "Weak", password = "Wendy-Secret-2026!x" });

        Assert.Equal(HttpStatusCode.BadRequest, weak.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, personal.StatusCode);
    }
}

public sealed class RateLimitTests(RateLimitedApiFactory host) : IClassFixture<RateLimitedApiFactory>
{
    [Fact]
    public async Task Hammering_the_login_endpoint_is_throttled()
    {
        var client = host.Factory.CreateClient();
        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 30; i++)
        {
            var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { email = "spam@test.local", password = "Nope-Nope-123!" });
            statuses.Add(response.StatusCode);
        }

        Assert.Contains(HttpStatusCode.TooManyRequests, statuses);
        Assert.True(statuses.Count(s => s == HttpStatusCode.TooManyRequests) >= 10);
    }
}
