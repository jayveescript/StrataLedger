using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;
using StrataLedger.Domain.Strata;
using StrataLedger.Infrastructure.Options;
using StrataLedger.Infrastructure.Persistence;

namespace StrataLedger.Infrastructure.Seeding;

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
            tier.Update(seed.Name, seed.Features, seed.MaxStrataPlans, seed.StorageQuotaMb, seed.IncludedOwners,
                seed.PerOwnerOverageCents, seed.MonthlyPriceCents);
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
        if (await db.Companies.AnyAsync(ct))
        {
            return;
        }

        var premier = Company.Create("Premier Strata VIC", "premier-strata-vic", "12 345 678 901", "Sarah Johnson",
            "info@premierstrata.com.au", "(03) 9000 1234", [AustralianState.VIC], SubscriptionTier.Professional);
        var abc = Company.Create("ABC Strata NSW/VIC", "abc-strata", "98 765 432 109", "Michael Chen",
            "admin@abcstrata.com.au", "(02) 8100 5678", [AustralianState.NSW, AustralianState.VIC], SubscriptionTier.Enterprise);
        var metro = Company.Create("Metro Property Management", "metro-property", "55 123 456 789", "Lisa Nguyen",
            "enquiries@metroproperty.com.au", "(07) 3100 9999", [AustralianState.QLD], SubscriptionTier.Starter);
        abc.UpdateBranding(new BrandSettings
        {
            DisplayName = "ABC Strata", LogoMark = "ABC", PrimaryColor = "#2563eb", PrimaryForeground = "#ffffff",
        });
        db.Companies.AddRange(premier, abc, metro);

        var fy = new DateOnly(2026, 7, 1);
        var plans = new[]
        {
            Plan(premier, "Southbank Residences", "PS612345", "123 Southbank Blvd, Melbourne VIC 3006", AustralianState.VIC, 24_500, 187_000, new(2026, 8, 15), PlanHealth.AtRisk),
            Plan(premier, "Collins Street Apartments", "PS789012", "456 Collins St, Melbourne VIC 3000", AustralianState.VIC, 8_750, 45_000, new(2026, 9, 20), PlanHealth.Healthy),
            Plan(abc, "St Kilda Beach Villas", "PS345678", "789 Fitzroy St, St Kilda VIC 3182", AustralianState.VIC, 3_200, 12_000, new(2026, 10, 10), PlanHealth.Critical),
            Plan(abc, "Darling Harbour Towers", "SP87654", "12 Harbour St, Sydney NSW 2000", AustralianState.NSW, 58_000, 312_000, new(2026, 11, 5), PlanHealth.Healthy),
            Plan(metro, "Brisbane River Residences", "BCP23456", "55 River Rd, Brisbane QLD 4000", AustralianState.QLD, 41_200, 228_000, new(2026, 7, 28), PlanHealth.Healthy),
        };
        db.StrataPlans.AddRange(plans);

        StrataPlan Plan(Company c, string name, string number, string address, AustralianState state, decimal admin,
            decimal capital, DateOnly agm, PlanHealth health)
        {
            var plan = StrataPlan.Create(c.Id, name, number, address, state, fy, agm);
            plan.SetOpeningBalances(admin, capital);
            plan.Update(name, address, state, PlanStatus.Active, health, fy, agm);
            return plan;
        }

        (string Unit, int Floor, LotType Type, int Units)[] southbank =
        [
            ("101", 1, LotType.Apartment, 12), ("102", 1, LotType.Apartment, 10), ("201", 2, LotType.Apartment, 14),
            ("202", 2, LotType.Apartment, 14), ("301", 3, LotType.Apartment, 16), ("302", 3, LotType.Apartment, 16),
            ("714", 7, LotType.Apartment, 15), ("501", 5, LotType.Apartment, 18), ("601", 6, LotType.Apartment, 20),
            ("B01", -1, LotType.Carpark, 4), ("S01", -2, LotType.Storage, 2), ("801", 8, LotType.Apartment, 25),
        ];
        var lots = southbank.Select((l, i) => Lot.Create(premier.Id, plans[0].Id, $"Lot {i + 1}", l.Unit, l.Floor, l.Type, l.Units)).ToList();
        lots.AddRange(Enumerable.Range(1, 10).Select(i =>
            Lot.Create(premier.Id, plans[1].Id, $"Lot {i}", $"{(i + 1) / 2}0{(i % 2) + 1}", (i + 1) / 2, LotType.Apartment, 18 + (i % 4) * 2)));
        db.Lots.AddRange(lots);

        (string First, string Last, string Email, int[] LotIndexes)[] owners =
        [
            ("James", "Chen", "james.chen@email.com", [6]),
            ("Sarah", "Mitchell", "sarah.mitchell@outlook.com", [2, 3]),
            ("Priya", "Sharma", "priya.sharma@gmail.com", [0]),
            ("Michael", "O'Brien", "m.obrien@bigpond.com", [11]),
            ("Nguyen", "Thi Lan", "nguyen.thilan@hotmail.com", [1]),
            ("Emma", "Thompson", "emma.thompson@email.com", [4, 5]),
            ("David", "Kowalski", "d.kowalski@gmail.com", [7]),
            ("Aisha", "Rahman", "aisha.rahman@outlook.com", [8]),
            ("Thomas", "Nguyen", "t.nguyen@bigpond.com.au", [9]),
            ("Lisa", "Wang", "lisa.wang@email.com.au", [12, 13]),
            ("Robert", "Fitzgerald", "robert.fitzgerald@hotmail.com", [14]),
            ("Mei", "Tanaka", "mei.tanaka@gmail.com", [15]),
            ("Kevin", "Pham", "kevin.pham@gmail.com", [10]),
        ];

        foreach (var o in owners)
        {
            var owner = Owner.Create(premier.Id, o.First, o.Last, o.Email, null, null, null);
            db.Owners.Add(owner);
            foreach (var index in o.LotIndexes)
            {
                lots[index].AssignOwner(owner.Id, 100m);
            }
        }

        await db.SaveChangesAsync(ct);

        var password = options.Value.SuperAdminPassword;
        if (!string.IsNullOrWhiteSpace(password))
        {
            await CreateUserAsync("admin@premierstrata.com.au", password, "Sarah", "Johnson", UserRole.CompanyAdmin, premier.Id);
            await CreateUserAsync("manager@premierstrata.com.au", password, "Tom", "Reid", UserRole.StrataManager, premier.Id);
            var ownerUser = await CreateUserAsync("james.chen@email.com", password, "James", "Chen", UserRole.Owner, premier.Id);
            if (ownerUser.Succeeded)
            {
                var james = await users.FindByEmailAsync("james.chen@email.com");
                var owner = await db.Owners.FirstAsync(o => o.Email == "james.chen@email.com", ct);
                owner.LinkUser(james!.Id);
                await db.SaveChangesAsync(ct);
            }
        }
    }

    private async Task<IdentityResult> CreateUserAsync(string email, string password, string first, string last, UserRole role, Guid? companyId)
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
            CompanyId = companyId,
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
