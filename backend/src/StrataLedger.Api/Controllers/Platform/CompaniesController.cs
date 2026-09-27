using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StrataLedger.Api.Authorization;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application.Features.Platform;
using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Api.Controllers.Platform;

public sealed record ChangeTierRequest(SubscriptionTier Tier);

public sealed record ChangeStatusRequest(CompanyStatus Status);

public sealed record SetFeatureRequest(bool Enabled, DateTimeOffset? ExpiresAt, string? Note);

[Route("api/v1/platform/companies")]
[Authorize(Roles = Roles.SuperAdmin)]
public sealed class CompaniesController : ApiControllerBase
{
    [HttpGet]
    [HasPermission(Permission.PlatformCompaniesManage)]
    public Task<IActionResult> List([FromQuery] ListCompaniesQuery query) => Send(query);

    [HttpGet("{id:guid}")]
    [HasPermission(Permission.PlatformCompaniesManage)]
    public Task<IActionResult> Get(Guid id) => Send(new GetCompanyQuery(id));

    [HttpPost]
    [HasPermission(Permission.PlatformCompaniesManage)]
    public Task<IActionResult> Create([FromBody] CreateCompanyCommand command) => SendCreated(command, "/api/v1/platform/companies");

    [HttpPut("{id:guid}")]
    [HasPermission(Permission.PlatformCompaniesManage)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateCompanyCommand command) => SendNoContent(command with { Id = id });

    [HttpPut("{id:guid}/tier")]
    [HasPermission(Permission.PlatformCompaniesManage)]
    public Task<IActionResult> ChangeTier(Guid id, [FromBody] ChangeTierRequest request) =>
        SendNoContent(new ChangeCompanyTierCommand(id, request.Tier));

    [HttpPut("{id:guid}/status")]
    [HasPermission(Permission.PlatformCompaniesManage)]
    public Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeStatusRequest request) =>
        SendNoContent(new ChangeCompanyStatusCommand(id, request.Status));

    [HttpPost("{id:guid}/force-logout")]
    [HasPermission(Permission.PlatformSessionsManage)]
    public Task<IActionResult> ForceLogout(Guid id) => Send(new ForceLogoutCompanyCommand(id), count => Ok(new { revoked = count }));

    [HttpGet("{id:guid}/features")]
    [HasPermission(Permission.PlatformFeaturesManage)]
    public Task<IActionResult> Features(Guid id) => Send(new GetCompanyFeaturesQuery(id));

    [HttpPut("{id:guid}/features/{feature}")]
    [HasPermission(Permission.PlatformFeaturesManage)]
    public Task<IActionResult> SetFeature(Guid id, Feature feature, [FromBody] SetFeatureRequest request) =>
        SendNoContent(new SetCompanyFeatureCommand(id, feature, request.Enabled, request.ExpiresAt, request.Note));

    [HttpDelete("{id:guid}/features/{feature}")]
    [HasPermission(Permission.PlatformFeaturesManage)]
    public Task<IActionResult> ClearFeature(Guid id, Feature feature) => SendNoContent(new ClearCompanyFeatureCommand(id, feature));
}
