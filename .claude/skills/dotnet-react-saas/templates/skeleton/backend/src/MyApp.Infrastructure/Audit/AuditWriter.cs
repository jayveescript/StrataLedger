using Microsoft.Extensions.DependencyInjection;
using MyApp.Application.Common.Services;
using MyApp.Domain.Audit;
using MyApp.Domain.Enums;
using MyApp.Infrastructure.Persistence;

namespace MyApp.Infrastructure.Audit;

/// <summary>Writes security events through a separate DbContext so they survive a rollback of the caller's work.</summary>
public sealed class AuditWriter(IServiceScopeFactory scopes, ICurrentUser currentUser, TimeProvider clock) : IAuditWriter
{
    public async Task WriteSecurityEventAsync(AuditAction action, Guid? userId, Guid? tenantId, string? detail = null,
        CancellationToken cancellationToken = default)
    {
        await using var scope = scopes.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<ITenantContext>().EnterPlatformScopeAsync(cancellationToken);
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var changes = detail is null ? null : System.Text.Json.JsonSerializer.Serialize(new { detail });
        db.AuditLogs.Add(new AuditLog(tenantId, userId, action, "Security", userId?.ToString(), changes,
            currentUser.IpAddress, currentUser.UserAgent, clock.GetUtcNow()));
        await db.SaveChangesAsync(cancellationToken);
    }
}
