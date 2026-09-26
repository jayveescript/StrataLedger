using Microsoft.Extensions.DependencyInjection;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Audit;
using StrataLedger.Domain.Enums;
using StrataLedger.Infrastructure.Persistence;

namespace StrataLedger.Infrastructure.Audit;

/// <summary>Writes security events through a separate DbContext so they survive a rollback of the caller's work.</summary>
public sealed class AuditWriter(IServiceScopeFactory scopes, ICurrentUser currentUser, TimeProvider clock) : IAuditWriter
{
    public async Task WriteSecurityEventAsync(AuditAction action, Guid? userId, Guid? companyId, string? detail = null,
        CancellationToken cancellationToken = default)
    {
        await using var scope = scopes.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<ITenantContext>().EnterPlatformScopeAsync(cancellationToken);
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var changes = detail is null ? null : System.Text.Json.JsonSerializer.Serialize(new { detail });
        db.AuditLogs.Add(new AuditLog(companyId, userId, action, "Security", userId?.ToString(), changes,
            currentUser.IpAddress, currentUser.UserAgent, clock.GetUtcNow()));
        await db.SaveChangesAsync(cancellationToken);
    }
}
