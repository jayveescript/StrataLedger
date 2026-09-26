using StrataLedger.Domain.Common;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Domain.Strata;

public sealed class Lot : TenantEntity
{
    private Lot() { }

    public static Lot Create(Guid companyId, Guid strataPlanId, string lotNumber, string? unitNumber, int? floor,
        LotType type, int entitlementUnits) => new()
    {
        CompanyId = companyId,
        StrataPlanId = strataPlanId,
        LotNumber = lotNumber.Trim(),
        UnitNumber = unitNumber?.Trim(),
        Floor = floor,
        Type = type,
        EntitlementUnits = entitlementUnits,
    };

    public Guid StrataPlanId { get; private set; }
    public StrataPlan? StrataPlan { get; private set; }
    public string LotNumber { get; private set; } = string.Empty;
    public string? UnitNumber { get; private set; }
    public int? Floor { get; private set; }
    public LotType Type { get; private set; }
    public LotStatus Status { get; private set; } = LotStatus.Vacant;
    public int EntitlementUnits { get; private set; }

    public List<LotOwnership> Ownerships { get; private set; } = [];

    public void Update(string lotNumber, string? unitNumber, int? floor, LotType type, LotStatus status, int entitlementUnits)
    {
        LotNumber = lotNumber.Trim();
        UnitNumber = unitNumber?.Trim();
        Floor = floor;
        Type = type;
        Status = status;
        EntitlementUnits = entitlementUnits;
    }

    public void AssignOwner(Guid ownerId, decimal sharePercent)
    {
        if (Ownerships.Any(o => o.OwnerId == ownerId))
        {
            return;
        }

        Ownerships.Add(new LotOwnership(CompanyId, Id, ownerId, sharePercent));
        if (Status == LotStatus.Vacant)
        {
            Status = LotStatus.Occupied;
        }
    }

    public bool RemoveOwner(Guid ownerId) => Ownerships.RemoveAll(o => o.OwnerId == ownerId) > 0;
}
