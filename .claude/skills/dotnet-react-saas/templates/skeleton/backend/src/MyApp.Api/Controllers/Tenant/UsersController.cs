using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.Api.Authorization;
using MyApp.Api.Infrastructure;
using MyApp.Application.Features.TenantAdmin;
using MyApp.Domain.Authorization;
using MyApp.Domain.Enums;

namespace MyApp.Api.Controllers.Tenant;

public sealed record UpdateUserRequest(UserRole Role, bool IsCommitteeMember, bool IsActive);

/// <summary>Tenant user management. Super Admin passes <c>tenantId</c> to act on any tenant.</summary>
[Route("api/v1/tenant/users")]
[Authorize(Roles = $"{Roles.TenantAdmins},{Roles.Manager}")]
public sealed class UsersController : ApiControllerBase
{
    [HttpGet]
    [HasPermission(Permission.TenantUsersRead)]
    public Task<IActionResult> List([FromQuery] ListTenantUsersQuery query) => Send(query);

    [HttpPut("{id:guid}")]
    [HasPermission(Permission.TenantUsersManage)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request) =>
        SendNoContent(new UpdateTenantUserCommand(id, request.Role, request.IsCommitteeMember, request.IsActive));

    [HttpPost("{id:guid}/revoke-sessions")]
    [HasPermission(Permission.TenantUsersManage)]
    public Task<IActionResult> RevokeSessions(Guid id) => Send(new RevokeUserSessionsCommand(id), n => Ok(new { revoked = n }));

    [HttpPost("{id:guid}/unlock")]
    [HasPermission(Permission.TenantUsersManage)]
    public Task<IActionResult> Unlock(Guid id) => SendNoContent(new UnlockUserCommand(id));
}
