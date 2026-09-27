using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.Api.Authorization;
using MyApp.Api.Infrastructure;
using MyApp.Application.Features.Platform;
using MyApp.Domain.Authorization;
using MyApp.Domain.Enums;

namespace MyApp.Api.Controllers.Platform;

[Route("api/v1/platform/tiers")]
[Authorize(Roles = Roles.SuperAdmin)]
[HasPermission(Permission.PlatformTiersManage)]
public sealed class TiersController : ApiControllerBase
{
    [HttpGet]
    public Task<IActionResult> List() => Send(new ListTiersQuery());

    [HttpPut("{tier}")]
    public Task<IActionResult> Update(SubscriptionTier tier, [FromBody] UpdateTierCommand command) =>
        SendNoContent(command with { Tier = tier });
}
