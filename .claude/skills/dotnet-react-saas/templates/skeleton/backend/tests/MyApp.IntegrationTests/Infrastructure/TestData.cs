using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using MyApp.Application.Common.Services;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;
using MyApp.Domain.Items;
using MyApp.Infrastructure.Persistence;

namespace MyApp.IntegrationTests.Infrastructure;

public sealed record TestUser(Guid Id, string Email, string Password, string? AuthenticatorKey, Guid? TenantId);

/// <summary>Arranges data directly through the app's own services (platform scope), bypassing the HTTP surface.</summary>
public static class TestData
{
    public const string SuperAdminEmail = "root@platform.test";
    public const string Password = "Correct-Horse-Battery-9!";

    public static async Task<Tenant> CreateTenantAsync(this ApiFactory factory, SubscriptionTier tier = SubscriptionTier.Professional)
    {
        return await factory.InPlatformScopeAsync(async (sp, db) =>
        {
            var suffix = Guid.NewGuid().ToString("N")[..8];
            var tenant = Tenant.Create($"Test Co {suffix}", $"test-{suffix}", null, "Contact", $"c{suffix}@test.local", null, tier);
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync();
            return tenant;
        });
    }

    public static Task<Item> CreateItemAsync(this ApiFactory factory, Guid tenantId, string? name = null) =>
        factory.InPlatformScopeAsync(async (_, db) =>
        {
            var item = Item.Create(tenantId, name ?? $"Item {Guid.NewGuid():N}"[..13], null, 10m);
            db.Items.Add(item);
            await db.SaveChangesAsync();
            return item;
        });

    /// <summary>Creates a user; staff get MFA enabled with a known authenticator key so tests can produce TOTP codes.</summary>
    public static Task<TestUser> CreateUserAsync(this ApiFactory factory, Guid? tenantId, UserRole role, bool enableMfa = true) =>
        factory.InPlatformScopeAsync(async (sp, _) =>
        {
            var users = sp.GetRequiredService<UserManager<ApplicationUser>>();
            var email = $"{role.ToString().ToLowerInvariant()}.{Guid.NewGuid():N}@test.local";
            var user = new ApplicationUser
            {
                UserName = email, Email = email, EmailConfirmed = true, FirstName = "Test", LastName = role.ToString(),
                Role = role, TenantId = tenantId, CreatedAt = DateTimeOffset.UtcNow, LockoutEnabled = true,
            };
            var created = await users.CreateAsync(user, Password);
            if (!created.Succeeded)
            {
                throw new InvalidOperationException(string.Join("; ", created.Errors.Select(e => e.Description)));
            }

            string? key = null;
            if (enableMfa)
            {
                await users.ResetAuthenticatorKeyAsync(user);
                key = await users.GetAuthenticatorKeyAsync(user);
                await users.SetTwoFactorEnabledAsync(user, true);
            }

            return new TestUser(user.Id, email, Password, key, tenantId);
        });

    public static async Task<T> InPlatformScopeAsync<T>(this ApiFactory factory, Func<IServiceProvider, AppDbContext, Task<T>> work)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<ITenantContext>().EnterPlatformScopeAsync();
        return await work(scope.ServiceProvider, scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }
}
