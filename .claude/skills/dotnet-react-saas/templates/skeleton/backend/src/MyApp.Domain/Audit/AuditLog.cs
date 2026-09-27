using MyApp.Domain.Common;
using MyApp.Domain.Enums;

namespace MyApp.Domain.Audit;

public sealed class AuditLog : Entity
{
    private AuditLog() { }

    public AuditLog(Guid? tenantId, Guid? userId, AuditAction action, string entityType, string? entityId,
        string? changes, string? ipAddress, string? userAgent, DateTimeOffset timestamp)
    {
        TenantId = tenantId;
        UserId = userId;
        Action = action;
        EntityType = entityType;
        EntityId = entityId;
        Changes = changes;
        IpAddress = ipAddress;
        UserAgent = userAgent;
        Timestamp = timestamp;
    }

    public Guid? TenantId { get; private set; }
    public Guid? UserId { get; private set; }
    public AuditAction Action { get; private set; }
    public string EntityType { get; private set; } = string.Empty;
    public string? EntityId { get; private set; }

    /// <summary>JSON object of changed properties: { "Name": { "old": "...", "new": "..." } }.</summary>
    public string? Changes { get; private set; }

    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public DateTimeOffset Timestamp { get; private set; }
}
