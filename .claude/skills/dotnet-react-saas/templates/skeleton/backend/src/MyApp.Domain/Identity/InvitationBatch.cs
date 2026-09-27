using MyApp.Domain.Common;

namespace MyApp.Domain.Identity;

/// <summary>One uploaded email list.</summary>
public sealed class InvitationBatch : AuditableEntity, ITenantOwned
{
    private InvitationBatch() { }

    public InvitationBatch(Guid tenantId, string fileName, int rowCount)
    {
        TenantId = tenantId;
        FileName = fileName;
        RowCount = rowCount;
    }

    public Guid TenantId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public int RowCount { get; private set; }
}
