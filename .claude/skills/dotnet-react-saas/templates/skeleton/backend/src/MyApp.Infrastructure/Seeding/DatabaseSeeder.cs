using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MyApp.Application.Common.Services;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;
using MyApp.Domain.Items;
using MyApp.Infrastructure.Options;
using MyApp.Infrastructure.Persistence;

namespace MyApp.Infrastructure.Seeding;

/// <summary>Idempotent seed: price book, the platform Super Admin, and optional demo tenants from the prototype.</summary>
public sealed partial class DatabaseSeeder(
    AppDbContext db,
    ITenantContext tenant,
    UserManager<ApplicationUser> users,
    IOptions<SeedOptions> options,
    TimeProvider clock,
    ILogger<DatabaseSeeder> logger)
{
    public async Task SeedAsync(CancellationToken ct = default)
    {
        await tenant.EnterPlatformScopeAsync(ct);
        await SeedTiersAsync(ct);
        await SeedSuperAdminAsync(ct);

        if (options.Value.DemoData)
        {
            await SeedDemoAsync(ct);
        }
    }

    private async Task SeedTiersAsync(CancellationToken ct)
    {
        var existing = await db.Tiers.Select(t => t.Tier).ToListAsync(ct);
        foreach (var seed in TierCatalog.Defaults.Where(s => !existing.Contains(s.Tier)))
        {
            var tier = new TierDefinition(seed.Tier, seed.Name);
            tier.Update(seed.Name, seed.Features, seed.MaxItems, seed.StorageQuotaMb, seed.IncludedSeats,
                seed.PerSeatOverageCents, seed.MonthlyPriceCents);
            db.Tiers.Add(tier);
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task SeedSuperAdminAsync(CancellationToken ct)
    {
        var (email, password) = (options.Value.SuperAdminEmail, options.Value.SuperAdminPassword);
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password) || await users.FindByEmailAsync(email) is not null)
        {
            return;
        }

        var result = await CreateUserAsync(email, password, "Platform", "Administrator", UserRole.SuperAdmin, null);
        LogSuperAdmin(logger, email, result.Succeeded, string.Join("; ", result.Errors.Select(e => e.Description)));
        await db.SaveChangesAsync(ct);
    }

    private async Task SeedDemoAsync(CancellationToken ct)
    {
        if (await db.Tenants.AnyAsync(ct))
        {
            return;
        }

        var acme = Tenant.Create("Acme Corporation", "acme", null, "Ada Admin", "admin@acme.test", null, SubscriptionTier.Professional);
        var globex = Tenant.Create("Globex", "globex", null, "Gus Admin", "admin@globex.test", null, SubscriptionTier.Starter);
        globex.UpdateBranding(new BrandSettings { DisplayName = "Globex", LogoMark = "GX", PrimaryColor = "#2563eb", PrimaryForeground = "#ffffff" });
        db.Tenants.AddRange(acme, globex);
        db.Items.AddRange(
            Item.Create(acme.Id, "First item", "Seeded example", 120m),
            Item.Create(acme.Id, "Second item", null, 75.5m),
            Item.Create(globex.Id, "Globex item", null, 10m));
        await db.SaveChangesAsync(ct);

        var password = options.Value.SuperAdminPassword;
        if (!string.IsNullOrWhiteSpace(password))
        {
            await CreateUserAsync("admin@acme.test", password, "Ada", "Admin", UserRole.TenantAdmin, acme.Id);
            await CreateUserAsync("manager@acme.test", password, "Max", "Manager", UserRole.Manager, acme.Id);
            await CreateUserAsync("member@acme.test", password, "Mia", "Member", UserRole.Member, acme.Id);
        }
    }

    private async Task<IdentityResult> CreateUserAsync(string email, string password, string first, string last, UserRole role, Guid? tenantId)
    {
        var now = clock.GetUtcNow();
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = first,
            LastName = last,
            Role = role,
            TenantId = tenantId,
            CreatedAt = now,
            PasswordChangedAt = now,
            LockoutEnabled = true,
        };

        return await users.CreateAsync(user, password);
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Seeded super admin {Email}: {Succeeded} {Errors}")]
    private static partial void LogSuperAdmin(ILogger logger, string email, bool succeeded, string errors);
}

public static class SeedingExtensions
{
    public static async Task MigrateAndSeedAsync(this IServiceProvider services, bool migrate, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<ITenantContext>().EnterPlatformScopeAsync(ct);
        if (migrate)
        {
            await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync(ct);
        }

        await scope.ServiceProvider.GetRequiredService<DatabaseSeeder>().SeedAsync(ct);
    }
}
