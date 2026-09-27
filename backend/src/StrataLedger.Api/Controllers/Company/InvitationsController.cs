using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using StrataLedger.Api.Authorization;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Features.Invitations;
using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Api.Controllers.Company;

public sealed record SendInvitationsRequest(string FileName, IReadOnlyList<InvitationRowInput> Rows);

/// <summary>Email-list upload (preview → send), resend and revoke. Super Admin passes <c>companyId</c>.</summary>
[Route("api/v1/company/invitations")]
[Authorize(Roles = $"{Roles.CompanyAdmins},{Roles.StrataManager}")]
[HasPermission(Permission.OwnersInvite)]
public sealed class InvitationsController : ApiControllerBase
{
    private const long MaxUploadBytes = 5 * 1024 * 1024;
    private static readonly string[] AllowedExtensions = [".csv", ".xlsx"];

    [HttpGet]
    public Task<IActionResult> List([FromQuery] ListInvitationsQuery query) => Send(query);

    [HttpPost("preview")]
    [EnableRateLimiting(RateLimitPolicies.Bulk)]
    [RequestSizeLimit(MaxUploadBytes)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Preview([FromQuery] Guid? companyId, IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        if (file.Length == 0 || file.Length > MaxUploadBytes || !AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            return ToProblem(Error.Validation("invitations.file", "Upload a .csv or .xlsx file up to 5 MB."));
        }

        await using var stream = file.OpenReadStream();
        return await Send(new PreviewInvitationUploadQuery(companyId, Path.GetFileName(file.FileName), stream));
    }

    [HttpPost]
    [EnableRateLimiting(RateLimitPolicies.Bulk)]
    public Task<IActionResult> SendBatch([FromQuery] Guid? companyId, [FromBody] SendInvitationsRequest request) =>
        Send(new SendInvitationsCommand(companyId, request.FileName, request.Rows));

    [HttpPost("{id:guid}/resend")]
    [EnableRateLimiting(RateLimitPolicies.Bulk)]
    public Task<IActionResult> Resend(Guid id) => SendNoContent(new ResendInvitationCommand(id));

    [HttpDelete("{id:guid}")]
    public Task<IActionResult> Revoke(Guid id) => SendNoContent(new RevokeInvitationCommand(id));

    /// <summary>A starter CSV with the expected headers.</summary>
    [HttpGet("template")]
    [Produces("text/csv")]
    public IActionResult Template() =>
        File("email,first_name,last_name,role,plan_number,lot_number\njane@example.com,Jane,Citizen,Owner,PS612345,Lot 1\n"u8.ToArray(),
            "text/csv", "invitations-template.csv");
}
