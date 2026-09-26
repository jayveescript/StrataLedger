using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Enums;
using StrataLedger.Infrastructure.Persistence;

namespace StrataLedger.Infrastructure.Identity;

/// <summary>
/// Checked on every authenticated request. The user's security stamp and the company's session version/status are
/// cached briefly in Redis so revocations (password change, role change, force logout, suspension) apply at once.
/// </summary>
public sealed class SessionValidator(AppDbContext db, IDistributedCache cache) : ISessionValidator
{
    private static readonly DistributedCacheEntryOptions CacheOptions = new() { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2) };

    private sealed record UserState(string Stamp, bool Active);

    private sealed record CompanyState(int Version, bool Active);

    public async Task<bool> IsValidAsync(Guid userId, string securityStamp, Guid? companyId, int companySessionVersion,
        CancellationToken cancellationToken = default)
    {
        var user = await GetOrLoadAsync(UserKey(userId), () => db.Users.AsNoTracking().IgnoreQueryFilters()
            .Where(u => u.Id == userId).Select(u => new UserState(u.SecurityStamp!, u.IsActive)).FirstOrDefaultAsync(cancellationToken),
            cancellationToken);

        if (user is not { Active: true } || user.Stamp != securityStamp)
        {
            return false;
        }

        if (companyId is not { } id)
        {
            return true;
        }

        var company = await GetOrLoadAsync(CompanyKey(id), () => db.Companies.AsNoTracking()
            .Where(c => c.Id == id).Select(c => new CompanyState(c.SessionVersion, c.Status == CompanyStatus.Active))
            .FirstOrDefaultAsync(cancellationToken), cancellationToken);

        return company is { Active: true } && company.Version == companySessionVersion;
    }

    public Task InvalidateUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        cache.RemoveAsync(UserKey(userId), cancellationToken);

    public Task InvalidateCompanyAsync(Guid companyId, CancellationToken cancellationToken = default) =>
        cache.RemoveAsync(CompanyKey(companyId), cancellationToken);

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

    private static string CompanyKey(Guid id) => $"sess:company:{id}";
}
