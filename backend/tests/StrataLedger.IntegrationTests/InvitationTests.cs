using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;
using StrataLedger.IntegrationTests.Infrastructure;

namespace StrataLedger.IntegrationTests;

public sealed class InvitationTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Upload_preview_validates_every_row_without_side_effects()
    {
        var company = await factory.CreateCompanyAsync();
        var plan = await factory.CreatePlanAsync(company.Id);
        var manager = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(company.Id, UserRole.StrataManager));
        var csv = $"email,first_name,last_name,role,plan_number,lot_number\n" +
                  $"a@test.local,Ann,Owner,Owner,{plan.PlanNumber},Lot 1\n" +
                  "b@test.local,Bob,Boss,Company Admin,,\n" +
                  "not-an-email,C,D,Owner,,\n";

        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(Encoding.UTF8.GetBytes(csv));
        file.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        form.Add(file, "file", "list.csv");
        var response = await manager.Http.PostAsync(new Uri("/api/v1/company/invitations/preview", UriKind.Relative), form);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var preview = await response.Content.ReadFromJsonAsync<JsonElement>(ApiClient.Json);
        Assert.Equal(1, preview.GetProperty("validRows").GetInt32()); // managers may only invite owners
        var pending = await factory.InPlatformScopeAsync((_, db) => db.Invitations.IgnoreQueryFilters().CountAsync(i => i.CompanyId == company.Id));
        Assert.Equal(0, pending);
    }

    [Fact]
    public async Task Invitation_is_single_use_and_links_the_owner_to_their_lot()
    {
        var company = await factory.CreateCompanyAsync();
        var plan = await factory.CreatePlanAsync(company.Id);
        var admin = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(company.Id, UserRole.CompanyAdmin));

        var send = await admin.PostAsync("/api/v1/company/invitations", new
        {
            fileName = "list.csv",
            rows = new[] { new { email = "newowner@test.local", firstName = "New", lastName = "Owner", role = "Owner", planNumber = plan.PlanNumber, lotNumber = "Lot 1" } },
        });
        Assert.Equal(HttpStatusCode.OK, send.StatusCode);

        // The raw token only exists in the email; issue a known one the same way the service does.
        var token = await factory.InPlatformScopeAsync(async (sp, db) =>
        {
            var tokens = sp.GetRequiredService<ISecureTokenGenerator>();
            var raw = tokens.Generate();
            var invitation = await db.Invitations.IgnoreQueryFilters().SingleAsync(i => i.Email == "newowner@test.local");
            invitation.Reissue(tokens.Hash(raw), DateTimeOffset.UtcNow.AddHours(1));
            await db.SaveChangesAsync();
            return raw;
        });

        var anonymous = new ApiClient(factory.CreateClient());
        var accept = new { token, firstName = "Nina", lastName = "Owens", password = "Harbour-Lights-2026!q" };
        var accepted = await anonymous.PostAsync("/api/v1/auth/invitations/accept", accept);
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.PostAsync("/api/v1/auth/invitations/accept", accept)).StatusCode);

        var owner = new TestUser(Guid.Empty, "newowner@test.local", "Harbour-Lights-2026!q", null, company.Id);
        var portal = await (await ApiClient.SignInAsync(factory, owner)).GetJsonAsync<JsonElement>("/api/v1/portal");
        Assert.Equal("Lot 1", portal.GetProperty("lots")[0].GetProperty("lotNumber").GetString());
    }

    [Fact]
    public async Task Weak_or_personal_passwords_are_rejected_on_acceptance()
    {
        var company = await factory.CreateCompanyAsync();
        var token = await factory.InPlatformScopeAsync(async (sp, db) =>
        {
            var tokens = sp.GetRequiredService<ISecureTokenGenerator>();
            var raw = tokens.Generate();
            db.Invitations.Add(new Invitation(company.Id, null, "weak@test.local", "Wendy", "Weak", UserRole.Owner, null, null,
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
