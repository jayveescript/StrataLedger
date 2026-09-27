using System.Net;
using System.Text.Json;
using Npgsql;
using MyApp.Domain.Enums;
using MyApp.IntegrationTests.Infrastructure;

namespace MyApp.IntegrationTests;

public sealed class TenancyAndFeatureTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static object NewItem(string name) => new { name, description = (string?)null, amount = 1 };

    [Fact]
    public async Task A_tenant_cannot_see_or_reach_another_tenants_data()
    {
        var tenantA = await factory.CreateTenantAsync();
        var tenantB = await factory.CreateTenantAsync();
        var itemB = await factory.CreateItemAsync(tenantB.Id);
        await factory.CreateItemAsync(tenantA.Id);
        var managerA = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(tenantA.Id, UserRole.Manager));

        var list = await managerA.GetJsonAsync<JsonElement>("/api/v1/items");
        Assert.Equal(1, list.GetProperty("totalCount").GetInt32());
        Assert.Equal(HttpStatusCode.NotFound, (await managerA.GetAsync($"/api/v1/items/{itemB.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await managerA.PostAsync($"/api/v1/items?tenantId={tenantB.Id}", NewItem("Cross-tenant"))).StatusCode);
    }

    [Fact]
    public async Task Row_level_security_blocks_queries_without_a_tenant()
    {
        var tenant = await factory.CreateTenantAsync();
        await factory.CreateItemAsync(tenant.Id);

        await using var connection = new NpgsqlConnection(factory.AppConnectionString);
        await connection.OpenAsync();
        await using var unscoped = new NpgsqlCommand("SELECT count(*) FROM items", connection);
        Assert.Equal(0L, (long)(await unscoped.ExecuteScalarAsync())!);

        await using var scoped = new NpgsqlCommand(
            $"SELECT set_config('app.tenant_id', '{tenant.Id}', false); SELECT count(*) FROM items", connection);
        await using var reader = await scoped.ExecuteReaderAsync();
        await reader.NextResultAsync();
        await reader.ReadAsync();
        Assert.Equal(1L, reader.GetInt64(0));
    }

    [Fact]
    public async Task Members_cannot_use_staff_endpoints()
    {
        var tenant = await factory.CreateTenantAsync();
        var member = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(tenant.Id, UserRole.Member, enableMfa: false));
        Assert.Equal(HttpStatusCode.Forbidden, (await member.GetAsync("/api/v1/items")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await member.GetAsync("/api/v1/platform/tenants")).StatusCode);
    }

    [Fact]
    public async Task Tier_item_limit_returns_payment_required()
    {
        var tenant = await factory.CreateTenantAsync(SubscriptionTier.Starter);
        await factory.InPlatformScopeAsync(async (_, db) =>
        {
            // Shrink the Starter limit so the test stays fast.
            var starter = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstAsync(db.Tiers, t => t.Tier == SubscriptionTier.Starter);
            starter.Update(starter.Name, starter.Features, 2, starter.StorageQuotaMb, starter.IncludedSeats, starter.PerSeatOverageCents, starter.MonthlyPriceCents);
            return await db.SaveChangesAsync();
        });
        await factory.CreateItemAsync(tenant.Id);
        await factory.CreateItemAsync(tenant.Id);

        var admin = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(tenant.Id, UserRole.TenantAdmin));
        var response = await admin.PostAsync("/api/v1/items", NewItem("One too many"));

        Assert.Equal(HttpStatusCode.PaymentRequired, response.StatusCode);
        Assert.Contains("limit.items", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Features_outside_the_tier_are_locked_until_super_admin_grants_them()
    {
        var tenant = await factory.CreateTenantAsync(SubscriptionTier.Starter);
        var admin = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(tenant.Id, UserRole.TenantAdmin));
        var branding = new
        {
            displayName = "Acme", logoMark = "AC", primaryColor = "#7c3aed", primaryForeground = "#ffffff", secondaryColor = "#d1d5db",
            secondaryForeground = "#111827", successColor = "#16a34a", warningColor = "#d97706", errorColor = "#dc2626",
            infoColor = "#2563eb", textPrimary = "#0f172a", textSecondary = "#475569", textMuted = "#94a3b8",
            surfaceBg = "#ffffff", surfaceCard = "#ffffff", borderColor = "#e2e8f0",
        };

        Assert.Equal(HttpStatusCode.PaymentRequired, (await admin.PutAsync("/api/v1/tenant/branding", branding)).StatusCode);

        var root = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(null, UserRole.SuperAdmin));
        var grant = await root.PutAsync($"/api/v1/platform/tenants/{tenant.Id}/features/CustomBranding", new { enabled = true });
        Assert.Equal(HttpStatusCode.NoContent, grant.StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.PutAsync("/api/v1/tenant/branding", branding)).StatusCode);
    }

    [Fact]
    public async Task Revoking_a_tier_feature_blocks_it_immediately()
    {
        var tenant = await factory.CreateTenantAsync();
        var manager = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(tenant.Id, UserRole.Manager));
        Assert.Equal(HttpStatusCode.OK, (await manager.GetAsync("/api/v1/items")).StatusCode);

        var root = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(null, UserRole.SuperAdmin));
        await root.PutAsync($"/api/v1/platform/tenants/{tenant.Id}/features/Items", new { enabled = false });

        Assert.Equal(HttpStatusCode.PaymentRequired, (await manager.GetAsync("/api/v1/items")).StatusCode);
    }

    [Fact]
    public async Task Suspending_a_tenant_kills_active_sessions()
    {
        var tenant = await factory.CreateTenantAsync();
        var manager = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(tenant.Id, UserRole.Manager));
        var root = await ApiClient.SignInAsync(factory, await factory.CreateUserAsync(null, UserRole.SuperAdmin));

        await root.PutAsync($"/api/v1/platform/tenants/{tenant.Id}/status", new { status = "Suspended" });

        Assert.Equal(HttpStatusCode.Unauthorized, (await manager.GetAsync("/api/v1/items")).StatusCode);
    }
}
