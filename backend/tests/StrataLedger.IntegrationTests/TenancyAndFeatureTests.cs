using System.Net;
using System.Text.Json;
using Npgsql;
using StrataLedger.Domain.Enums;
using StrataLedger.IntegrationTests.Infrastructure;

namespace StrataLedger.IntegrationTests;

public sealed class TenancyAndFeatureTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static object NewPlan(string number) => new
    {
        name = "New Plan", planNumber = number, address = "2 Test Rd", state = "VIC",
        financialYearStart = "2026-07-01", nextAgmDate = (string?)null, adminFundBalance = 0, capitalWorksFundBalance = 0,
    };

    [Fact]
    public async Task A_company_cannot_see_or_reach_another_companys_data()
    {
        var companyA = await factory.CreateCompanyAsync();
        var companyB = await factory.CreateCompanyAsync();
        var planB = await factory.CreatePlanAsync(companyB.Id);
        await factory.CreatePlanAsync(companyA.Id);
        var managerA = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(companyA.Id, UserRole.StrataManager));

        var list = await managerA.GetJsonAsync<JsonElement>("/api/v1/strata-plans");
        Assert.Equal(1, list.GetProperty("totalCount").GetInt32());
        Assert.Equal(HttpStatusCode.NotFound, (await managerA.GetAsync($"/api/v1/strata-plans/{planB.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await managerA.PostAsync($"/api/v1/owners?companyId={companyB.Id}",
            new { firstName = "A", lastName = "B", email = "ab@test.local" })).StatusCode);
    }

    [Fact]
    public async Task Row_level_security_blocks_queries_without_a_tenant()
    {
        var company = await factory.CreateCompanyAsync();
        await factory.CreatePlanAsync(company.Id);

        await using var connection = new NpgsqlConnection(factory.AppConnectionString);
        await connection.OpenAsync();
        await using var unscoped = new NpgsqlCommand("SELECT count(*) FROM strata_plans", connection);
        Assert.Equal(0L, (long)(await unscoped.ExecuteScalarAsync())!);

        await using var scoped = new NpgsqlCommand(
            $"SELECT set_config('app.company_id', '{company.Id}', false); SELECT count(*) FROM strata_plans", connection);
        await using var reader = await scoped.ExecuteReaderAsync();
        await reader.NextResultAsync();
        await reader.ReadAsync();
        Assert.Equal(1L, reader.GetInt64(0));
    }

    [Fact]
    public async Task Owners_cannot_use_staff_endpoints()
    {
        var company = await factory.CreateCompanyAsync();
        var owner = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(company.Id, UserRole.Owner, enableMfa: false));
        Assert.Equal(HttpStatusCode.Forbidden, (await owner.GetAsync("/api/v1/strata-plans")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await owner.GetAsync("/api/v1/platform/companies")).StatusCode);
    }

    [Fact]
    public async Task Tier_plan_limit_returns_payment_required()
    {
        var company = await factory.CreateCompanyAsync(SubscriptionTier.Starter);
        for (var i = 0; i < 5; i++)
        {
            await factory.CreatePlanAsync(company.Id);
        }

        var admin = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(company.Id, UserRole.CompanyAdmin));
        var response = await admin.PostAsync("/api/v1/strata-plans", NewPlan("PS000001"));

        Assert.Equal(HttpStatusCode.PaymentRequired, response.StatusCode);
        Assert.Contains("limit.strata_plans", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Features_outside_the_tier_are_locked_until_super_admin_grants_them()
    {
        var company = await factory.CreateCompanyAsync(SubscriptionTier.Starter);
        var admin = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(company.Id, UserRole.CompanyAdmin));
        var branding = new
        {
            displayName = "Acme", logoMark = "AC", primaryColor = "#7c3aed", primaryForeground = "#ffffff", secondaryColor = "#d1d5db",
            secondaryForeground = "#111827", successColor = "#16a34a", warningColor = "#d97706", errorColor = "#dc2626",
            infoColor = "#2563eb", textPrimary = "#0f172a", textSecondary = "#475569", textMuted = "#94a3b8",
            surfaceBg = "#ffffff", surfaceCard = "#ffffff", borderColor = "#e2e8f0",
        };

        Assert.Equal(HttpStatusCode.PaymentRequired, (await admin.PutAsync("/api/v1/company/branding", branding)).StatusCode);

        var root = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(null, UserRole.SuperAdmin));
        var grant = await root.PutAsync($"/api/v1/platform/companies/{company.Id}/features/CustomBranding", new { enabled = true });
        Assert.Equal(HttpStatusCode.NoContent, grant.StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.PutAsync("/api/v1/company/branding", branding)).StatusCode);
    }

    [Fact]
    public async Task Revoking_a_tier_feature_blocks_it_immediately()
    {
        var company = await factory.CreateCompanyAsync();
        var manager = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(company.Id, UserRole.StrataManager));
        Assert.Equal(HttpStatusCode.OK, (await manager.GetAsync("/api/v1/strata-plans")).StatusCode);

        var root = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(null, UserRole.SuperAdmin));
        await root.PutAsync($"/api/v1/platform/companies/{company.Id}/features/StrataPlans", new { enabled = false });

        Assert.Equal(HttpStatusCode.PaymentRequired, (await manager.GetAsync("/api/v1/strata-plans")).StatusCode);
    }

    [Fact]
    public async Task Suspending_a_company_kills_active_sessions()
    {
        var company = await factory.CreateCompanyAsync();
        var manager = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(company.Id, UserRole.StrataManager));
        var root = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(null, UserRole.SuperAdmin));

        await root.PutAsync($"/api/v1/platform/companies/{company.Id}/status", new { status = "Suspended" });

        Assert.Equal(HttpStatusCode.Unauthorized, (await manager.GetAsync("/api/v1/strata-plans")).StatusCode);
    }
}
