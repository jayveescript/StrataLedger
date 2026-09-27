using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StrataLedger.Api.Authorization;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application.Features.CompanyAdmin;
using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Api.Controllers.Company;

public sealed record UpdateUserRequest(UserRole Role, bool IsCommitteeMember, bool IsActive);

/// <summary>Company user management. Super Admin passes <c>companyId</c> to act on any company.</summary>
[Route("api/v1/company/users")]
[Authorize(Roles = $"{Roles.CompanyAdmins},{Roles.StrataManager}")]
public sealed class UsersController : ApiControllerBase
{
    [HttpGet]
    [HasPermission(Permission.CompanyUsersRead)]
    public Task<IActionResult> List([FromQuery] ListCompanyUsersQuery query) => Send(query);

    [HttpPut("{id:guid}")]
    [HasPermission(Permission.CompanyUsersManage)]
    public Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request) =>
        SendNoContent(new UpdateCompanyUserCommand(id, request.Role, request.IsCommitteeMember, request.IsActive));

    [HttpPost("{id:guid}/revoke-sessions")]
    [HasPermission(Permission.CompanyUsersManage)]
    public Task<IActionResult> RevokeSessions(Guid id) => Send(new RevokeUserSessionsCommand(id), n => Ok(new { revoked = n }));

    [HttpPost("{id:guid}/unlock")]
    [HasPermission(Permission.CompanyUsersManage)]
    public Task<IActionResult> Unlock(Guid id) => SendNoContent(new UnlockUserCommand(id));
}
