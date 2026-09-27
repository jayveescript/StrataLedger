using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;
using MyApp.Infrastructure.Persistence;

namespace MyApp.Infrastructure.Features;

/// <summary>Effective features = tier features, plus active grants, minus active revocations. Cached in Redis.</summary>
public sealed class FeatureService(AppDbContext db, IDistributedCache cache, TimeProvider clock) : IFeatureService
{
    private static readonly DistributedCacheEntryOptions CacheOptions = new() { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) };

    public async Task<IReadOnlySet<Feature>> GetEnabledFeaturesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var key = Key(tenantId);
        var cached = await cache.GetStringAsync(key, cancellationToken);
        if (cached is not null)
        {
            return JsonSerializer.Deserialize<HashSet<Feature>>(cached)!;
        }

        var features = await ComputeAsync(tenantId, cancellationToken);
        await cache.SetStringAsync(key, JsonSerializer.Serialize(features), CacheOptions, cancellationToken);
        return features;
    }

    public Task InvalidateAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        cache.RemoveAsync(Key(tenantId), cancellationToken);

    private async Task<HashSet<Feature>> ComputeAsync(Guid tenantId, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var tier = await db.Tenants.AsNoTracking().Where(c => c.Id == tenantId).Select(c => (SubscriptionTier?)c.Tier).FirstOrDefaultAsync(ct);
        if (tier is null)
        {
            return [];
        }

        var tierFeatures = await db.Tiers.AsNoTracking().Where(t => t.Tier == tier).Select(t => t.Features).FirstOrDefaultAsync(ct) ?? [];
        var overrides = await db.TenantFeatureOverrides.AsNoTracking()
            .Where(o => o.TenantId == tenantId && (o.ExpiresAt == null || o.ExpiresAt > now))
            .Select(o => new { o.Feature, o.Enabled })
            .ToListAsync(ct);

        var result = tierFeatures.ToHashSet();
        result.UnionWith(overrides.Where(o => o.Enabled).Select(o => o.Feature));
        result.ExceptWith(overrides.Where(o => !o.Enabled).Select(o => o.Feature));
        return result;
    }

    private static string Key(Guid tenantId) => $"features:{tenantId}";
}
