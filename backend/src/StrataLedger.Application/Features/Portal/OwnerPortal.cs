using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Strata;

namespace StrataLedger.Application.Features.Portal;

public sealed record PortalLot(Guid LotId, string LotNumber, string? UnitNumber, LotType Type, int EntitlementUnits,
    decimal SharePercent, Guid StrataPlanId, string PlanName, string PlanNumber, string Address, DateOnly? NextAgmDate,
    decimal AdminFundBalance, decimal CapitalWorksFundBalance, int PlanTotalEntitlement);

public sealed record OwnerPortalSummary(Guid OwnerId, string FirstName, string LastName, string Email, IReadOnlyList<PortalLot> Lots);

/// <summary>Owner home: only the lots and plans the signed-in owner actually holds.</summary>
[RequiresPermission(Permission.PortalAccess), RequiresFeature(Feature.OwnerPortal)]
public sealed record GetOwnerPortalQuery : IQuery<OwnerPortalSummary>;

public sealed class GetOwnerPortalHandler(ICurrentUser currentUser, IRepository<Owner> owners, IRepository<Lot> lots)
    : IRequestHandler<GetOwnerPortalQuery, OwnerPortalSummary>
{
    public async Task<Result<OwnerPortalSummary>> Handle(GetOwnerPortalQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId;
        var owner = await owners.Query().FirstOrDefaultAsync(o => o.UserId == userId, cancellationToken);
        if (owner is null)
        {
            return Error.NotFound("Owner");
        }

        var portalLots = await lots.Query()
            .SelectMany(l => l.Ownerships.Where(o => o.OwnerId == owner.Id), (l, o) => new { Lot = l, o.SharePercent })
            .Select(x => new PortalLot(x.Lot.Id, x.Lot.LotNumber, x.Lot.UnitNumber, x.Lot.Type, x.Lot.EntitlementUnits,
                x.SharePercent, x.Lot.StrataPlanId, x.Lot.StrataPlan!.Name, x.Lot.StrataPlan.PlanNumber, x.Lot.StrataPlan.Address,
                x.Lot.StrataPlan.NextAgmDate, x.Lot.StrataPlan.AdminFundBalance, x.Lot.StrataPlan.CapitalWorksFundBalance,
                x.Lot.StrataPlan.Lots.Where(pl => !pl.IsDeleted).Sum(pl => pl.EntitlementUnits)))
            .ToListAsync(cancellationToken);

        return new OwnerPortalSummary(owner.Id, owner.FirstName, owner.LastName, owner.Email, portalLots);
    }
}
