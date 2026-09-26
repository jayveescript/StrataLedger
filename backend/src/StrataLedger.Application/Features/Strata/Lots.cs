using FluentValidation;
using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Strata;

namespace StrataLedger.Application.Features.Strata;

public sealed record LotOwnerDto(Guid OwnerId, string Name, string Email, decimal SharePercent, bool HasPortalAccess);

public sealed record LotDto(Guid Id, Guid StrataPlanId, string LotNumber, string? UnitNumber, int? Floor, LotType Type,
    LotStatus Status, int EntitlementUnits, IReadOnlyList<LotOwnerDto> Owners);

internal static class LotProjections
{
    public static IQueryable<LotDto> ForPlan(IQueryable<Lot> lots, Guid planId) =>
        lots.Where(l => l.StrataPlanId == planId)
            .OrderBy(l => l.LotNumber.Length).ThenBy(l => l.LotNumber)
            .Select(l => new LotDto(l.Id, l.StrataPlanId, l.LotNumber, l.UnitNumber, l.Floor, l.Type, l.Status, l.EntitlementUnits,
                l.Ownerships.Select(o => new LotOwnerDto(o.OwnerId, o.Owner!.FirstName + " " + o.Owner.LastName, o.Owner.Email,
                    o.SharePercent, o.Owner.UserId != null)).ToList()));
}

[RequiresPermission(Permission.LotsRead), RequiresFeature(Feature.StrataPlans)]
public sealed record ListLotsQuery(Guid StrataPlanId) : IQuery<IReadOnlyList<LotDto>>;

public sealed class ListLotsHandler(IRepository<Lot> lots) : IRequestHandler<ListLotsQuery, IReadOnlyList<LotDto>>
{
    public async Task<Result<IReadOnlyList<LotDto>>> Handle(ListLotsQuery request, CancellationToken cancellationToken) =>
        await LotProjections.ForPlan(lots.Query(), request.StrataPlanId).ToListAsync(cancellationToken);
}

public abstract record LotFields(string LotNumber, string? UnitNumber, int? Floor, LotType Type, int EntitlementUnits);

public sealed class LotFieldsValidator : AbstractValidator<LotFields>
{
    public LotFieldsValidator()
    {
        RuleFor(x => x.LotNumber).NotEmpty().MaximumLength(30);
        RuleFor(x => x.UnitNumber).MaximumLength(30);
        RuleFor(x => x.Floor).InclusiveBetween(-10, 200);
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.EntitlementUnits).InclusiveBetween(0, 100_000);
    }
}

[RequiresPermission(Permission.LotsWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record CreateLotCommand(Guid StrataPlanId, string LotNumber, string? UnitNumber, int? Floor, LotType Type,
    int EntitlementUnits) : LotFields(LotNumber, UnitNumber, Floor, Type, EntitlementUnits), ICommand<Guid>;

public sealed class CreateLotValidator : AbstractValidator<CreateLotCommand>
{
    public CreateLotValidator() => Include(new LotFieldsValidator());
}

public sealed class CreateLotHandler(IRepository<StrataPlan> plans, IRepository<Lot> lots) : IRequestHandler<CreateLotCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateLotCommand request, CancellationToken cancellationToken)
    {
        var plan = await plans.Query().Where(p => p.Id == request.StrataPlanId)
            .Select(p => new { p.Id, p.CompanyId }).FirstOrDefaultAsync(cancellationToken);
        if (plan is null)
        {
            return Error.NotFound("StrataPlan");
        }

        var number = request.LotNumber.Trim();
        if (await lots.Query().AnyAsync(l => l.StrataPlanId == plan.Id && l.LotNumber == number, cancellationToken))
        {
            return Error.Conflict("lot.duplicate", $"{number} already exists in this plan.");
        }

        var lot = Lot.Create(plan.CompanyId, plan.Id, number, request.UnitNumber, request.Floor, request.Type, request.EntitlementUnits);
        lots.Add(lot);
        return lot.Id;
    }
}

[RequiresPermission(Permission.LotsWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record UpdateLotCommand(Guid Id, string LotNumber, string? UnitNumber, int? Floor, LotType Type, LotStatus Status,
    int EntitlementUnits) : LotFields(LotNumber, UnitNumber, Floor, Type, EntitlementUnits), ICommand<Unit>;

public sealed class UpdateLotValidator : AbstractValidator<UpdateLotCommand>
{
    public UpdateLotValidator()
    {
        Include(new LotFieldsValidator());
        RuleFor(x => x.Status).IsInEnum();
    }
}

public sealed class UpdateLotHandler(IRepository<Lot> lots) : IRequestHandler<UpdateLotCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateLotCommand request, CancellationToken cancellationToken)
    {
        var lot = await lots.FindAsync(request.Id, cancellationToken);
        if (lot is null)
        {
            return Error.NotFound("Lot");
        }

        lot.Update(request.LotNumber, request.UnitNumber, request.Floor, request.Type, request.Status, request.EntitlementUnits);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.LotsWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record DeleteLotCommand(Guid Id) : ICommand<Unit>;

public sealed class DeleteLotHandler(IRepository<Lot> lots) : IRequestHandler<DeleteLotCommand, Unit>
{
    public async Task<Result<Unit>> Handle(DeleteLotCommand request, CancellationToken cancellationToken)
    {
        var lot = await lots.FindAsync(request.Id, cancellationToken);
        if (lot is null)
        {
            return Error.NotFound("Lot");
        }

        lots.Remove(lot);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.LotsWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record AssignLotOwnerCommand(Guid LotId, Guid OwnerId, decimal SharePercent) : ICommand<Unit>;

public sealed class AssignLotOwnerValidator : AbstractValidator<AssignLotOwnerCommand>
{
    public AssignLotOwnerValidator() => RuleFor(x => x.SharePercent).GreaterThan(0).LessThanOrEqualTo(100);
}

public sealed class AssignLotOwnerHandler(IRepository<Lot> lots, IRepository<Owner> owners) : IRequestHandler<AssignLotOwnerCommand, Unit>
{
    public async Task<Result<Unit>> Handle(AssignLotOwnerCommand request, CancellationToken cancellationToken)
    {
        var lot = await lots.QueryTracked().Include(l => l.Ownerships).FirstOrDefaultAsync(l => l.Id == request.LotId, cancellationToken);
        var ownerExists = await owners.Query().AnyAsync(o => o.Id == request.OwnerId, cancellationToken);

        return (lot, ownerExists) switch
        {
            (null, _) => Error.NotFound("Lot"),
            (_, false) => Error.NotFound("Owner"),
            _ when lot.Ownerships.Any(o => o.OwnerId == request.OwnerId) =>
                Error.Conflict("lot.owner_exists", "This owner is already assigned to the lot."),
            _ when request.SharePercent > lot.UnallocatedShare =>
                Error.Validation("lot.share_exceeded", "Ownership shares for a lot cannot exceed 100%."),
            _ => Assign(lot, request),
        };
    }

    private static Result<Unit> Assign(Lot lot, AssignLotOwnerCommand request)
    {
        lot.AssignOwner(request.OwnerId, request.SharePercent);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.LotsWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record RemoveLotOwnerCommand(Guid LotId, Guid OwnerId) : ICommand<Unit>;

public sealed class RemoveLotOwnerHandler(IRepository<Lot> lots) : IRequestHandler<RemoveLotOwnerCommand, Unit>
{
    public async Task<Result<Unit>> Handle(RemoveLotOwnerCommand request, CancellationToken cancellationToken)
    {
        var lot = await lots.QueryTracked().Include(l => l.Ownerships).FirstOrDefaultAsync(l => l.Id == request.LotId, cancellationToken);
        return lot is not null && lot.RemoveOwner(request.OwnerId) ? Unit.Value : Error.NotFound("LotOwnership");
    }
}
