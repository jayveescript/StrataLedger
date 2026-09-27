using System.Linq.Expressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Audit;
using StrataLedger.Domain.Common;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Files;
using StrataLedger.Domain.Identity;
using StrataLedger.Domain.Messaging;
using StrataLedger.Domain.Strata;

namespace StrataLedger.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenant)
    : IdentityUserContext<ApplicationUser, Guid>(options), IUnitOfWork
{
    public const string TenantFilter = "Tenant";
    public const string SoftDeleteFilter = "SoftDelete";

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<TierDefinition> Tiers => Set<TierDefinition>();
    public DbSet<CompanyFeatureOverride> CompanyFeatureOverrides => Set<CompanyFeatureOverride>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordHistoryEntry> PasswordHistory => Set<PasswordHistoryEntry>();
    public DbSet<Invitation> Invitations => Set<Invitation>();
    public DbSet<InvitationBatch> InvitationBatches => Set<InvitationBatch>();
    public DbSet<StrataPlan> StrataPlans => Set<StrataPlan>();
    public DbSet<Lot> Lots => Set<Lot>();
    public DbSet<Owner> Owners => Set<Owner>();
    public DbSet<LotOwnership> LotOwnerships => Set<LotOwnership>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<StoredFile> Files => Set<StoredFile>();
    public DbSet<EmailMessage> EmailMessages => Set<EmailMessage>();

    // Read by the query filters on every query execution (EF parameterises members of the context instance).
    private Guid? CurrentCompanyId => tenant.CompanyId;
    private bool BypassTenantFilter => tenant.IsPlatformScope;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");

        foreach (var entityType in builder.Model.GetEntityTypes().Where(t => t.BaseType is null && !t.IsOwned()))
        {
            var clr = entityType.ClrType;
            if (typeof(Entity).IsAssignableFrom(clr))
            {
                // Ids are Guid v7s assigned in the domain; this also makes EF insert (not update) children added
                // through navigations such as Lot.Ownerships.
                builder.Entity(clr).Property(nameof(Entity.Id)).ValueGeneratedNever();
            }

            if (typeof(ITenantOwned).IsAssignableFrom(clr))
            {
                builder.Entity(clr).HasQueryFilter(TenantFilter, BuildTenantFilter(clr));
                builder.Entity(clr).HasIndex(nameof(ITenantOwned.CompanyId));
            }

            if (typeof(ISoftDeletable).IsAssignableFrom(clr))
            {
                builder.Entity(clr).HasQueryFilter(SoftDeleteFilter, BuildSoftDeleteFilter(clr));
            }
        }
    }

    private LambdaExpression BuildTenantFilter(Type clr)
    {
        // e => BypassTenantFilter || e.CompanyId == CurrentCompanyId
        var e = Expression.Parameter(clr, "e");
        var context = Expression.Constant(this);
        var bypass = Expression.Property(context, nameof(BypassTenantFilter));
        var current = Expression.Property(context, nameof(CurrentCompanyId));
        var companyId = Expression.Convert(Expression.Property(e, nameof(ITenantOwned.CompanyId)), typeof(Guid?));
        return Expression.Lambda(Expression.OrElse(bypass, Expression.Equal(companyId, current)), e);
    }

    private static LambdaExpression BuildSoftDeleteFilter(Type clr)
    {
        var e = Expression.Parameter(clr, "e");
        return Expression.Lambda(Expression.Not(Expression.Property(e, nameof(ISoftDeletable.IsDeleted))), e);
    }

    public async Task<Result<T>> ExecuteInTransactionAsync<T>(Func<CancellationToken, Task<Result<T>>> work,
        CancellationToken cancellationToken = default)
    {
        if (Database.CurrentTransaction is not null)
        {
            return await work(cancellationToken);
        }

        var strategy = Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async ct =>
        {
            await using var transaction = await Database.BeginTransactionAsync(ct);
            var result = await work(ct);
            if (result.IsSuccess)
            {
                await transaction.CommitAsync(ct);
            }
            else
            {
                await transaction.RollbackAsync(ct);
                ChangeTracker.Clear();
            }

            return result;
        }, cancellationToken);
    }
}
