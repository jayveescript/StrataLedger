using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;
using MyApp.Infrastructure.Persistence;

namespace MyApp.Infrastructure.Identity;

/// <summary>
/// Checked on every authenticated request. The user's security stamp and the tenant's session version/status are
/// cached briefly in Redis so revocations (password change, role change, force logout, suspension) apply at once.
/// </summary>
public sealed class SessionValidator(AppDbContext db, IDistributedCache cache) : ISessionValidator
{
    private static readonly DistributedCacheEntryOptions CacheOptions = new() { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2) };

    private sealed record UserState(string Stamp, bool Active);

    private sealed record TenantState(int Version, bool Active);

    public async Task<bool> IsValidAsync(Guid userId, string securityStamp, Guid? tenantId, int tenantSessionVersion,
        CancellationToken cancellationToken = default)
    {
        var user = await GetOrLoadAsync(UserKey(userId), () => db.Users.AsNoTracking().IgnoreQueryFilters()
            .Where(u => u.Id == userId).Select(u => new UserState(u.SecurityStamp!, u.IsActive)).FirstOrDefaultAsync(cancellationToken),
            cancellationToken);

        if (user is not { Active: true } || user.Stamp != securityStamp)
        {
            return false;
        }

        if (tenantId is not { } id)
        {
            return true;
        }

        var tenant = await GetOrLoadAsync(TenantKey(id), () => db.Tenants.AsNoTracking()
            .Where(c => c.Id == id).Select(c => new TenantState(c.SessionVersion, c.Status == TenantStatus.Active))
            .FirstOrDefaultAsync(cancellationToken), cancellationToken);

        return tenant is { Active: true } && tenant.Version == tenantSessionVersion;
    }

    public Task InvalidateUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        cache.RemoveAsync(UserKey(userId), cancellationToken);

    public Task InvalidateTenantAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        cache.RemoveAsync(TenantKey(tenantId), cancellationToken);

    private async Task<T?> GetOrLoadAsync<T>(string key, Func<Task<T?>> load, CancellationToken ct) where T : class
    {
        var cached = await cache.GetStringAsync(key, ct);
        if (cached is not null)
        {
            return JsonSerializer.Deserialize<T>(cached);
        }

        var value = await load();
        if (value is not null)
        {
            await cache.SetStringAsync(key, JsonSerializer.Serialize(value), CacheOptions, ct);
        }

        return value;
    }

    private static string UserKey(Guid id) => $"sess:user:{id}";

    private static string TenantKey(Guid id) => $"sess:tenant:{id}";
}
