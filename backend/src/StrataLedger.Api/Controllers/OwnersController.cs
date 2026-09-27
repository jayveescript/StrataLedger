using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StrataLedger.Api.Authorization;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application.Features.Strata;
using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Api.Controllers;

[Route("api/v1/owners")]
[Authorize(Roles = $"{Roles.CompanyStaff},{Roles.SuperAdmin}")]
[FeatureGate(Feature.StrataPlans)]
public sealed class OwnersController : ApiControllerBase
{
    [HttpGet]
    [HasPermission(Permission.OwnersRead)]
    public Task<IActionResult> List([FromQuery] ListOwnersQuery query) => Send(query);

    [HttpGet("{id:guid}")]
    [HasPermission(Permission.OwnersRead)]
    public Task<IActionResult> Get(Guid id) => Send(new GetOwnerQuery(id));

    [HttpPost]
    [HasPermission(Permission.OwnersWrite)]
    public Task<IActionResult> Create([FromQuery] Guid? companyId, [FromBody] CreateOwnerCommand command) =>
        SendCreated(command with { CompanyId = companyId ?? command.CompanyId }, "/api/v1/owners");

    [HttpPut("{id:guid}")]
    [HasPermission(Permission.OwnersWrite)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateOwnerCommand command) => SendNoContent(command with { Id = id });

    [HttpDelete("{id:guid}")]
    [HasPermission(Permission.OwnersWrite)]
    public Task<IActionResult> Delete(Guid id) => SendNoContent(new DeleteOwnerCommand(id));

    [HttpPost("{id:guid}/invite")]
    [HasPermission(Permission.OwnersInvite)]
    [FeatureGate(Feature.OwnerPortal)]
    public Task<IActionResult> Invite(Guid id) => SendNoContent(new InviteOwnerToPortalCommand(id));
}
