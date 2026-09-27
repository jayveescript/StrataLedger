using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StrataLedger.Api.Authorization;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application.Features.Platform;
using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Api.Controllers.Platform;

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
