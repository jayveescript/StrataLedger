using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StrataLedger.Api.Authorization;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application.Features.Portal;
using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Api.Controllers;

[Route("api/v1/portal")]
[Authorize(Roles = Roles.Owner)]
[HasPermission(Permission.PortalAccess)]
[FeatureGate(Feature.OwnerPortal)]
public sealed class PortalController : ApiControllerBase
{
    [HttpGet]
    public Task<IActionResult> Home() => Send(new GetOwnerPortalQuery());
}
