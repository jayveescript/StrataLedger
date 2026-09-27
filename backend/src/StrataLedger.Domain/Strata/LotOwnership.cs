using StrataLedger.Domain.Common;

namespace StrataLedger.Domain.Strata;

public sealed class LotOwnership : Entity, ITenantOwned
{
    private LotOwnership() { }

    internal LotOwnership(Guid companyId, Guid lotId, Guid ownerId, decimal sharePercent)
    {
        CompanyId = companyId;
        LotId = lotId;
        OwnerId = ownerId;
        SharePercent = sharePercent;
    }

    public Guid CompanyId { get; private set; }
    public Guid LotId { get; private set; }
    public Lot? Lot { get; private set; }
    public Guid OwnerId { get; private set; }
    public Owner? Owner { get; private set; }
    public decimal SharePercent { get; private set; }
}
