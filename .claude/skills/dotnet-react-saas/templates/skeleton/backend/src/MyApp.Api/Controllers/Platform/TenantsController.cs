using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.Api.Authorization;
using MyApp.Api.Infrastructure;
using MyApp.Application.Features.Platform;
using MyApp.Domain.Authorization;
using MyApp.Domain.Enums;

namespace MyApp.Api.Controllers.Platform;

public sealed record ChangeTierRequest(SubscriptionTier Tier);

public sealed record ChangeStatusRequest(TenantStatus Status);

public sealed record SetFeatureRequest(bool Enabled, DateTimeOffset? ExpiresAt, string? Note);

[Route("api/v1/platform/tenants")]
[Authorize(Roles = Roles.SuperAdmin)]
public sealed class TenantsController : ApiControllerBase
{
    [HttpGet]
    [HasPermission(Permission.PlatformTenantsManage)]
    public Task<IActionResult> List([FromQuery] ListTenantsQuery query) => Send(query);

    [HttpGet("{id:guid}")]
    [HasPermission(Permission.PlatformTenantsManage)]
    public Task<IActionResult> Get(Guid id) => Send(new GetTenantQuery(id));

    [HttpPost]
    [HasPermission(Permission.PlatformTenantsManage)]
    public Task<IActionResult> Create([FromBody] CreateTenantCommand command) => SendCreated(command, "/api/v1/platform/tenants");

    [HttpPut("{id:guid}")]
    [HasPermission(Permission.PlatformTenantsManage)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateTenantCommand command) => SendNoContent(command with { Id = id });

    [HttpPut("{id:guid}/tier")]
    [HasPermission(Permission.PlatformTenantsManage)]
    public Task<IActionResult> ChangeTier(Guid id, [FromBody] ChangeTierRequest request) =>
        SendNoContent(new ChangeTenantTierCommand(id, request.Tier));

    [HttpPut("{id:guid}/status")]
    [HasPermission(Permission.PlatformTenantsManage)]
    public Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeStatusRequest request) =>
        SendNoContent(new ChangeTenantStatusCommand(id, request.Status));

    [HttpPost("{id:guid}/force-logout")]
    [HasPermission(Permission.PlatformSessionsManage)]
    public Task<IActionResult> ForceLogout(Guid id) => Send(new ForceLogoutTenantCommand(id), count => Ok(new { revoked = count }));

    [HttpGet("{id:guid}/features")]
    [HasPermission(Permission.PlatformFeaturesManage)]
    public Task<IActionResult> Features(Guid id) => Send(new GetTenantFeaturesQuery(id));

    [HttpPut("{id:guid}/features/{feature}")]
    [HasPermission(Permission.PlatformFeaturesManage)]
    public Task<IActionResult> SetFeature(Guid id, Feature feature, [FromBody] SetFeatureRequest request) =>
        SendNoContent(new SetTenantFeatureCommand(id, feature, request.Enabled, request.ExpiresAt, request.Note));

    [HttpDelete("{id:guid}/features/{feature}")]
    [HasPermission(Permission.PlatformFeaturesManage)]
    public Task<IActionResult> ClearFeature(Guid id, Feature feature) => SendNoContent(new ClearTenantFeatureCommand(id, feature));
}
