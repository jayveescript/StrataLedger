using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StrataLedger.Api.Authorization;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application.Features.Strata;
using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Api.Controllers;

[Route("api/v1/strata-plans")]
[Authorize(Roles = $"{Roles.CompanyStaff},{Roles.SuperAdmin}")]
[FeatureGate(Feature.StrataPlans)]
public sealed class StrataPlansController : ApiControllerBase
{
    private const string Location = "/api/v1/strata-plans";

    [HttpGet]
    [HasPermission(Permission.PlansRead)]
    public Task<IActionResult> List([FromQuery] ListStrataPlansQuery query) => Send(query);

    [HttpGet("{id:guid}")]
    [HasPermission(Permission.PlansRead)]
    public Task<IActionResult> Get(Guid id) => Send(new GetStrataPlanQuery(id));

    [HttpPost]
    [HasPermission(Permission.PlansWrite)]
    public Task<IActionResult> Create([FromQuery] Guid? companyId, [FromBody] CreateStrataPlanCommand command) =>
        SendCreated(command with { CompanyId = companyId ?? command.CompanyId }, Location);

    [HttpPut("{id:guid}")]
    [HasPermission(Permission.PlansWrite)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateStrataPlanCommand command) => SendNoContent(command with { Id = id });

    [HttpDelete("{id:guid}")]
    [HasPermission(Permission.PlansWrite)]
    public Task<IActionResult> Delete(Guid id) => SendNoContent(new DeleteStrataPlanCommand(id));

    [HttpGet("{id:guid}/lots")]
    [HasPermission(Permission.LotsRead)]
    public Task<IActionResult> Lots(Guid id) => Send(new ListLotsQuery(id));

    [HttpPost("{id:guid}/lots")]
    [HasPermission(Permission.LotsWrite)]
    public Task<IActionResult> CreateLot(Guid id, [FromBody] CreateLotCommand command) =>
        SendCreated(command with { StrataPlanId = id }, "/api/v1/lots");

    [HttpGet("~/api/v1/dashboard")]
    [HasPermission(Permission.PlansRead)]
    public Task<IActionResult> Dashboard() => Send(new GetDashboardSummaryQuery());
}

public sealed record AssignOwnerRequest(Guid OwnerId, decimal SharePercent);

[Route("api/v1/lots")]
[Authorize(Roles = $"{Roles.CompanyStaff},{Roles.SuperAdmin}")]
[FeatureGate(Feature.StrataPlans)]
public sealed class LotsController : ApiControllerBase
{
    [HttpPut("{id:guid}")]
    [HasPermission(Permission.LotsWrite)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateLotCommand command) => SendNoContent(command with { Id = id });

    [HttpDelete("{id:guid}")]
    [HasPermission(Permission.LotsWrite)]
    public Task<IActionResult> Delete(Guid id) => SendNoContent(new DeleteLotCommand(id));

    [HttpPost("{id:guid}/owners")]
    [HasPermission(Permission.LotsWrite)]
    public Task<IActionResult> AssignOwner(Guid id, [FromBody] AssignOwnerRequest request) =>
        SendNoContent(new AssignLotOwnerCommand(id, request.OwnerId, request.SharePercent));

    [HttpDelete("{id:guid}/owners/{ownerId:guid}")]
    [HasPermission(Permission.LotsWrite)]
    public Task<IActionResult> RemoveOwner(Guid id, Guid ownerId) => SendNoContent(new RemoveLotOwnerCommand(id, ownerId));
}
