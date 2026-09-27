using StrataLedger.Domain.Common;

namespace StrataLedger.Domain.Identity;

/// <summary>One uploaded email list.</summary>
public sealed class InvitationBatch : AuditableEntity, ITenantOwned
{
    private InvitationBatch() { }

    public InvitationBatch(Guid companyId, string fileName, int rowCount)
    {
        CompanyId = companyId;
        FileName = fileName;
        RowCount = rowCount;
    }

    public Guid CompanyId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public int RowCount { get; private set; }
}
