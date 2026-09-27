using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application.Features.Account;

namespace StrataLedger.Api.Controllers;

[Route("api/v1/account")]
[Authorize]
public sealed class AccountController : ApiControllerBase
{
    [HttpPut("profile")]
    public Task<IActionResult> UpdateProfile([FromBody] UpdateProfileCommand command) => SendNoContent(command);

    [HttpPost("password")]
    public Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command) => SendNoContent(command);

    [HttpGet("sessions")]
    public Task<IActionResult> Sessions() => Send(new ListMySessionsQuery());

    [HttpDelete("sessions/{id:guid}")]
    public Task<IActionResult> RevokeSession(Guid id) => SendNoContent(new RevokeMySessionCommand(id));

    [HttpDelete("sessions")]
    public Task<IActionResult> RevokeAllSessions() => Send(new RevokeAllMySessionsCommand(), count => Ok(new { revoked = count }));
}
