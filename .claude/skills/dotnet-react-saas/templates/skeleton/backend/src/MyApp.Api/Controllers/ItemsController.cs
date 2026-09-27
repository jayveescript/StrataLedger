using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.Api.Authorization;
using MyApp.Api.Infrastructure;
using MyApp.Application.Features.Items;
using MyApp.Domain.Authorization;
using MyApp.Domain.Enums;

namespace MyApp.Api.Controllers;

/// <summary>
/// Reference controller: coarse role gate on the class, permission per action, plan feature gate, and every action a
/// one-liner that dispatches a request. Route ids always override ids in the body.
/// </summary>
[Route("api/v1/items")]
[Authorize(Roles = $"{Roles.TenantStaff},{Roles.SuperAdmin}")]
[FeatureGate(Feature.Items)]
public sealed class ItemsController : ApiControllerBase
{
    [HttpGet]
    [HasPermission(Permission.ItemsRead)]
    public Task<IActionResult> List([FromQuery] ListItemsQuery query) => Send(query);

    [HttpGet("{id:guid}")]
    [HasPermission(Permission.ItemsRead)]
    public Task<IActionResult> Get(Guid id) => Send(new GetItemQuery(id));

    [HttpPost]
    [HasPermission(Permission.ItemsWrite)]
    public Task<IActionResult> Create([FromQuery] Guid? tenantId, [FromBody] CreateItemCommand command) =>
        SendCreated(command with { TenantId = tenantId ?? command.TenantId }, "/api/v1/items");

    [HttpPut("{id:guid}")]
    [HasPermission(Permission.ItemsWrite)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateItemCommand command) => SendNoContent(command with { Id = id });

    [HttpDelete("{id:guid}")]
    [HasPermission(Permission.ItemsWrite)]
    public Task<IActionResult> Delete(Guid id) => SendNoContent(new DeleteItemCommand(id));
}
