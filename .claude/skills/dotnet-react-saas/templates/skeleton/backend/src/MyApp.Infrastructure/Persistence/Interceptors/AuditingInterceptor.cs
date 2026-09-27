using System.Collections.Frozen;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using MyApp.Application.Common.Services;
using MyApp.Domain.Audit;
using MyApp.Domain.Common;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Files;
using MyApp.Domain.Identity;
using MyApp.Domain.Messaging;

namespace MyApp.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Stamps created/updated metadata, converts deletes of soft-deletable rows into flags, and writes an audit row
/// (with a property-level diff) for every business change in the same transaction.
/// </summary>
public sealed class AuditingInterceptor(ICurrentUser currentUser, TimeProvider clock) : SaveChangesInterceptor
{
    private static readonly FrozenSet<Type> NotAudited = new[]
    {
        typeof(AuditLog), typeof(RefreshToken), typeof(EmailMessage), typeof(PasswordHistoryEntry),
    }.ToFrozenSet();

    private static readonly FrozenSet<string> HiddenProperties = new[]
    {
        "PasswordHash", "SecurityStamp", "ConcurrencyStamp", "TokenHash", "Content", "AccessFailedCount",
        "LastLoginAt", "NormalizedEmail", "NormalizedUserName", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy",
    }.ToFrozenSet(StringComparer.Ordinal);

    private static readonly FrozenDictionary<EntityState, AuditAction> Actions = new Dictionary<EntityState, AuditAction>
    {
        [EntityState.Added] = AuditAction.Created,
        [EntityState.Modified] = AuditAction.Updated,
        [EntityState.Deleted] = AuditAction.Deleted,
    }.ToFrozenDictionary();

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData,
        InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        Apply(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Apply(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    private void Apply(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        var now = clock.GetUtcNow();
        var userId = currentUser.UserId;
        var entries = context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        var logs = new List<AuditLog>();
        foreach (var entry in entries)
        {
            var action = Actions[entry.State];
            Stamp(entry, now, userId);
            SoftDelete(entry, now);

            if (!NotAudited.Contains(entry.Entity.GetType()) && BuildLog(entry, action, now, userId) is { } log)
            {
                logs.Add(log);
            }
        }

        context.AddRange(logs);
    }

    private static void Stamp(EntityEntry entry, DateTimeOffset now, Guid? userId)
    {
        if (entry.Entity is not IAuditable auditable)
        {
            return;
        }

        if (entry.State == EntityState.Added)
        {
            auditable.CreatedAt = now;
            auditable.CreatedBy = userId;
            return;
        }

        auditable.UpdatedAt = now;
        auditable.UpdatedBy = userId;
    }

    private static void SoftDelete(EntityEntry entry, DateTimeOffset now)
    {
        if (entry is not { State: EntityState.Deleted, Entity: ISoftDeletable deletable })
        {
            return;
        }

        entry.State = EntityState.Modified;
        deletable.IsDeleted = true;
        deletable.DeletedAt = now;
    }

    private AuditLog? BuildLog(EntityEntry entry, AuditAction action, DateTimeOffset now, Guid? userId)
    {
        var changes = entry.Properties
            .Where(p => !HiddenProperties.Contains(p.Metadata.Name) && !p.Metadata.IsShadowProperty())
            .Where(p => action != AuditAction.Updated || p.IsModified)
            .ToDictionary(
                p => p.Metadata.Name,
                p => new { old = action == AuditAction.Created ? null : p.OriginalValue, @new = p.CurrentValue });

        var complexChanged = entry.ComplexProperties.Where(c => c.IsModified).Select(c => c.Metadata.Name).ToList();
        if (action == AuditAction.Updated && changes.Count == 0 && complexChanged.Count == 0)
        {
            return null;
        }

        var payload = JsonSerializer.Serialize(new { properties = changes, complex = complexChanged });
        var entityId = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString();
        return new AuditLog(ResolveTenantId(entry.Entity), userId, action, entry.Entity.GetType().Name, entityId, payload,
            currentUser.IpAddress, currentUser.UserAgent, now);
    }

    private Guid? ResolveTenantId(object entity) => entity switch
    {
        ITenantOwned owned => owned.TenantId,
        Tenant tenant => tenant.Id,
        ApplicationUser user => user.TenantId,
        TenantFeatureOverride o => o.TenantId,
        StoredFile f => f.TenantId,
        _ => currentUser.TenantId,
    };
}
