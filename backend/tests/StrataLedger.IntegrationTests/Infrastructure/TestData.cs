using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;
using StrataLedger.Domain.Strata;
using StrataLedger.Infrastructure.Persistence;

namespace StrataLedger.IntegrationTests.Infrastructure;

public sealed record TestUser(Guid Id, string Email, string Password, string? AuthenticatorKey, Guid? CompanyId);

/// <summary>Arranges data directly through the app's own services (platform scope), bypassing the HTTP surface.</summary>
public static class TestData
{
    public const string SuperAdminEmail = "root@platform.test";
    public const string Password = "Correct-Horse-Battery-9!";

    public static async Task<Company> CreateCompanyAsync(this ApiFactory factory, SubscriptionTier tier = SubscriptionTier.Professional)
    {
        return await factory.InPlatformScopeAsync(async (sp, db) =>
        {
            var suffix = Guid.NewGuid().ToString("N")[..8];
            var company = Company.Create($"Test Co {suffix}", $"test-{suffix}", null, "Contact", $"c{suffix}@test.local", null,
                [AustralianState.VIC], tier);
            db.Companies.Add(company);
            await db.SaveChangesAsync();
            return company;
        });
    }

    public static Task<StrataPlan> CreatePlanAsync(this ApiFactory factory, Guid companyId, string? number = null) =>
        factory.InPlatformScopeAsync(async (_, db) =>
        {
            var plan = StrataPlan.Create(companyId, "Harbour View", number ?? $"PS{Random.Shared.Next(100000, 999999)}",
                "1 Test St", AustralianState.VIC, new DateOnly(2026, 7, 1), null);
            var lot = Lot.Create(companyId, plan.Id, "Lot 1", "101", 1, LotType.Apartment, 10);
            db.StrataPlans.Add(plan);
            db.Lots.Add(lot);
            await db.SaveChangesAsync();
            return plan;
        });

    /// <summary>Creates a user; staff get MFA enabled with a known authenticator key so tests can produce TOTP codes.</summary>
    public static Task<TestUser> CreateUserAsync(this ApiFactory factory, Guid? companyId, UserRole role, bool enableMfa = true) =>
        factory.InPlatformScopeAsync(async (sp, _) =>
        {
            var users = sp.GetRequiredService<UserManager<ApplicationUser>>();
            var email = $"{role.ToString().ToLowerInvariant()}.{Guid.NewGuid():N}@test.local";
            var user = new ApplicationUser
            {
                UserName = email, Email = email, EmailConfirmed = true, FirstName = "Test", LastName = role.ToString(),
                Role = role, CompanyId = companyId, CreatedAt = DateTimeOffset.UtcNow, LockoutEnabled = true,
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

            return new TestUser(user.Id, email, Password, key, companyId);
        });

    public static async Task<T> InPlatformScopeAsync<T>(this ApiFactory factory, Func<IServiceProvider, AppDbContext, Task<T>> work)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<ITenantContext>().EnterPlatformScopeAsync();
        return await work(scope.ServiceProvider, scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }
}
