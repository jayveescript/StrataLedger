using System.Linq.Expressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Services;
using MyApp.Domain.Audit;
using MyApp.Domain.Common;
using MyApp.Domain.Tenants;
using MyApp.Domain.Files;
using MyApp.Domain.Identity;
using MyApp.Domain.Messaging;
using MyApp.Domain.Items;

namespace MyApp.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenant)
    : IdentityUserContext<ApplicationUser, Guid>(options), IUnitOfWork
{
    public const string TenantFilter = "Tenant";
    public const string SoftDeleteFilter = "SoftDelete";

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<TierDefinition> Tiers => Set<TierDefinition>();
    public DbSet<TenantFeatureOverride> TenantFeatureOverrides => Set<TenantFeatureOverride>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordHistoryEntry> PasswordHistory => Set<PasswordHistoryEntry>();
    public DbSet<Invitation> Invitations => Set<Invitation>();
    public DbSet<InvitationBatch> InvitationBatches => Set<InvitationBatch>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<StoredFile> Files => Set<StoredFile>();
    public DbSet<EmailMessage> EmailMessages => Set<EmailMessage>();

    // Read by the query filters on every query execution (EF parameterises members of the context instance).
    private Guid? CurrentTenantId => tenant.TenantId;
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
                // through navigations (e.g. Tenant.FeatureOverrides).
                builder.Entity(clr).Property(nameof(Entity.Id)).ValueGeneratedNever();
            }

            if (typeof(ITenantOwned).IsAssignableFrom(clr))
            {
                builder.Entity(clr).HasQueryFilter(TenantFilter, BuildTenantFilter(clr));
                builder.Entity(clr).HasIndex(nameof(ITenantOwned.TenantId));
            }

            if (typeof(ISoftDeletable).IsAssignableFrom(clr))
            {
                builder.Entity(clr).HasQueryFilter(SoftDeleteFilter, BuildSoftDeleteFilter(clr));
            }
        }
    }

    private LambdaExpression BuildTenantFilter(Type clr)
    {
        // e => BypassTenantFilter || e.TenantId == CurrentTenantId
        var e = Expression.Parameter(clr, "e");
        var context = Expression.Constant(this);
        var bypass = Expression.Property(context, nameof(BypassTenantFilter));
        var current = Expression.Property(context, nameof(CurrentTenantId));
        var tenantId = Expression.Convert(Expression.Property(e, nameof(ITenantOwned.TenantId)), typeof(Guid?));
        return Expression.Lambda(Expression.OrElse(bypass, Expression.Equal(tenantId, current)), e);
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
