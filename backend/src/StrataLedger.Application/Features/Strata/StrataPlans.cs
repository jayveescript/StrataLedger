using FluentValidation;
using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Models;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Application.Common.Services;
using StrataLedger.Application.Features.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Strata;

namespace StrataLedger.Application.Features.Strata;

public sealed record StrataPlanListItem(Guid Id, string Name, string PlanNumber, string Address, AustralianState State,
    PlanStatus Status, PlanHealth Health, int TotalLots, int OwnerCount, decimal AdminFundBalance,
    decimal CapitalWorksFundBalance, DateOnly? NextAgmDate);

public sealed record StrataPlanDetail(Guid Id, string Name, string PlanNumber, string Address, AustralianState State,
    PlanStatus Status, PlanHealth Health, DateOnly FinancialYearStart, DateOnly? NextAgmDate, decimal AdminFundBalance,
    decimal CapitalWorksFundBalance, int TotalEntitlement, IReadOnlyList<LotDto> Lots);

[RequiresPermission(Permission.PlansRead), RequiresFeature(Feature.StrataPlans)]
public sealed record ListStrataPlansQuery(string? Search, AustralianState? State, PlanStatus? Status, int Page = 1, int PageSize = 25)
    : PageRequest(Page, PageSize), IQuery<PagedResult<StrataPlanListItem>>;

public sealed class ListStrataPlansHandler(IRepository<StrataPlan> plans)
    : IRequestHandler<ListStrataPlansQuery, PagedResult<StrataPlanListItem>>
{
    public async Task<Result<PagedResult<StrataPlanListItem>>> Handle(ListStrataPlansQuery request, CancellationToken cancellationToken)
    {
        var term = request.Search?.Trim().ToLower();
        var query = plans.Query()
            .WhereIf(!string.IsNullOrEmpty(term), p => p.Name.ToLower().Contains(term!) || p.PlanNumber.ToLower().Contains(term!)
                || p.Address.ToLower().Contains(term!))
            .WhereIf(request.State.HasValue, p => p.State == request.State)
            .WhereIf(request.Status.HasValue, p => p.Status == request.Status)
            .OrderBy(p => p.Name)
            .Select(p => new StrataPlanListItem(p.Id, p.Name, p.PlanNumber, p.Address, p.State, p.Status, p.Health,
                p.Lots.Count(l => !l.IsDeleted),
                p.Lots.Where(l => !l.IsDeleted).SelectMany(l => l.Ownerships).Select(o => o.OwnerId).Distinct().Count(),
                p.AdminFundBalance, p.CapitalWorksFundBalance, p.NextAgmDate));

        return await query.ToPagedResultAsync(request, cancellationToken);
    }
}

[RequiresPermission(Permission.PlansRead), RequiresFeature(Feature.StrataPlans)]
public sealed record GetStrataPlanQuery(Guid Id) : IQuery<StrataPlanDetail>;

public sealed class GetStrataPlanHandler(IRepository<StrataPlan> plans, IRepository<Lot> lots)
    : IRequestHandler<GetStrataPlanQuery, StrataPlanDetail>
{
    public async Task<Result<StrataPlanDetail>> Handle(GetStrataPlanQuery request, CancellationToken cancellationToken)
    {
        var plan = await plans.Query().FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        if (plan is null)
        {
            return Error.NotFound("StrataPlan");
        }

        var lotDtos = await LotProjections.ForPlan(lots.Query(), plan.Id).ToListAsync(cancellationToken);
        return new StrataPlanDetail(plan.Id, plan.Name, plan.PlanNumber, plan.Address, plan.State, plan.Status, plan.Health,
            plan.FinancialYearStart, plan.NextAgmDate, plan.AdminFundBalance, plan.CapitalWorksFundBalance,
            lotDtos.Sum(l => l.EntitlementUnits), lotDtos);
    }
}

public abstract record StrataPlanFields(string Name, string Address, AustralianState State, DateOnly FinancialYearStart,
    DateOnly? NextAgmDate);

public sealed class StrataPlanFieldsValidator : AbstractValidator<StrataPlanFields>
{
    public StrataPlanFieldsValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(300);
        RuleFor(x => x.State).IsInEnum();
    }
}

[RequiresPermission(Permission.PlansWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record CreateStrataPlanCommand(Guid? CompanyId, string Name, string PlanNumber, string Address, AustralianState State,
    DateOnly FinancialYearStart, DateOnly? NextAgmDate, decimal AdminFundBalance, decimal CapitalWorksFundBalance)
    : StrataPlanFields(Name, Address, State, FinancialYearStart, NextAgmDate), ICommand<Guid>;

public sealed class CreateStrataPlanValidator : AbstractValidator<CreateStrataPlanCommand>
{
    public CreateStrataPlanValidator()
    {
        Include(new StrataPlanFieldsValidator());
        RuleFor(x => x.PlanNumber).NotEmpty().MaximumLength(30).Matches("^[A-Za-z0-9\\- ]+$");
    }
}

public sealed class CreateStrataPlanHandler(ICurrentUser currentUser, IRepository<StrataPlan> plans, UsageLimits limits)
    : IRequestHandler<CreateStrataPlanCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateStrataPlanCommand request, CancellationToken cancellationToken)
    {
        var companyId = currentUser.ResolveCompany(request.CompanyId);
        if (companyId.IsFailure)
        {
            return companyId.Error!;
        }

        var limit = await limits.EnsureCanAddStrataPlanAsync(companyId.Value, cancellationToken);
        if (limit.IsFailure)
        {
            return limit.Error!;
        }

        var number = request.PlanNumber.Trim().ToUpperInvariant();
        if (await plans.Query().AnyAsync(p => p.CompanyId == companyId.Value && p.PlanNumber == number, cancellationToken))
        {
            return Error.Conflict("strata_plan.duplicate", $"Plan number {number} already exists.");
        }

        var plan = StrataPlan.Create(companyId.Value, request.Name, number, request.Address, request.State,
            request.FinancialYearStart, request.NextAgmDate);
        plan.SetOpeningBalances(request.AdminFundBalance, request.CapitalWorksFundBalance);
        plans.Add(plan);
        return plan.Id;
    }
}

[RequiresPermission(Permission.PlansWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record UpdateStrataPlanCommand(Guid Id, string Name, string Address, AustralianState State, PlanStatus Status,
    PlanHealth Health, DateOnly FinancialYearStart, DateOnly? NextAgmDate)
    : StrataPlanFields(Name, Address, State, FinancialYearStart, NextAgmDate), ICommand<Unit>;

public sealed class UpdateStrataPlanValidator : AbstractValidator<UpdateStrataPlanCommand>
{
    public UpdateStrataPlanValidator()
    {
        Include(new StrataPlanFieldsValidator());
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Health).IsInEnum();
    }
}

public sealed class UpdateStrataPlanHandler(IRepository<StrataPlan> plans) : IRequestHandler<UpdateStrataPlanCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateStrataPlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await plans.FindAsync(request.Id, cancellationToken);
        if (plan is null)
        {
            return Error.NotFound("StrataPlan");
        }

        plan.Update(request.Name, request.Address, request.State, request.Status, request.Health, request.FinancialYearStart,
            request.NextAgmDate);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.PlansWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record DeleteStrataPlanCommand(Guid Id) : ICommand<Unit>;

public sealed class DeleteStrataPlanHandler(IRepository<StrataPlan> plans) : IRequestHandler<DeleteStrataPlanCommand, Unit>
{
    public async Task<Result<Unit>> Handle(DeleteStrataPlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await plans.FindAsync(request.Id, cancellationToken);
        if (plan is null)
        {
            return Error.NotFound("StrataPlan");
        }

        plans.Remove(plan);
        return Unit.Value;
    }
}
