using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;
using StrataLedger.Domain.Strata;

namespace StrataLedger.Application.Features.Strata;

public sealed record PlanAlert(Guid Id, string Name, PlanHealth Health, DateOnly? NextAgmDate);

public sealed record DashboardSummary(int StrataPlans, int Lots, int Owners, int OwnersWithPortal, int PendingInvitations,
    decimal AdminFundTotal, decimal CapitalWorksFundTotal, IReadOnlyList<PlanAlert> Alerts);

[RequiresPermission(Permission.PlansRead), RequiresFeature(Feature.StrataPlans)]
public sealed record GetDashboardSummaryQuery : IQuery<DashboardSummary>;

public sealed class GetDashboardSummaryHandler(
    IRepository<StrataPlan> plans,
    IRepository<Lot> lots,
    IRepository<Owner> owners,
    IRepository<Invitation> invitations,
    TimeProvider clock) : IRequestHandler<GetDashboardSummaryQuery, DashboardSummary>
{
    public async Task<Result<DashboardSummary>> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var soon = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime.AddDays(60));
        var totals = await plans.Query()
            .GroupBy(_ => 1)
            .Select(g => new { Count = g.Count(), Admin = g.Sum(p => p.AdminFundBalance), Capital = g.Sum(p => p.CapitalWorksFundBalance) })
            .FirstOrDefaultAsync(cancellationToken);

        var alerts = await plans.Query()
            .Where(p => p.Health != PlanHealth.Healthy || (p.NextAgmDate != null && p.NextAgmDate <= soon))
            .OrderByDescending(p => p.Health).ThenBy(p => p.NextAgmDate)
            .Take(10)
            .Select(p => new PlanAlert(p.Id, p.Name, p.Health, p.NextAgmDate))
            .ToListAsync(cancellationToken);

        return new DashboardSummary(
            totals?.Count ?? 0,
            await lots.Query().CountAsync(cancellationToken),
            await owners.Query().CountAsync(cancellationToken),
            await owners.Query().CountAsync(o => o.UserId != null, cancellationToken),
            await invitations.Query().CountAsync(i => i.Status == InvitationStatus.Pending, cancellationToken),
            totals?.Admin ?? 0,
            totals?.Capital ?? 0,
            alerts);
    }
}
