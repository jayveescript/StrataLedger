using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StrataLedger.Api.Authorization;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Features.CompanyAdmin;
using StrataLedger.Application.Features.Companies;
using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Api.Controllers.Company;

/// <summary>Branding, usage/billing and audit trail for a company.</summary>
[Route("api/v1/company")]
[Authorize(Roles = $"{Roles.CompanyAdmins},{Roles.Accountant}")]
public sealed class CompanySettingsController : ApiControllerBase
{
    [HttpGet("branding")]
    [HasPermission(Permission.CompanyBrandingManage)]
    public Task<IActionResult> GetBranding([FromQuery] Guid? companyId) => Send(new GetBrandingQuery(companyId));

    [HttpPut("branding")]
    [HasPermission(Permission.CompanyBrandingManage)]
    [FeatureGate(Feature.CustomBranding)]
    public Task<IActionResult> UpdateBranding([FromQuery] Guid? companyId, [FromBody] UpdateBrandingCommand command) =>
        Send(command with { CompanyId = companyId });

    [HttpPost("branding/logo")]
    [HasPermission(Permission.CompanyBrandingManage)]
    [FeatureGate(Feature.CustomBranding)]
    [RequestSizeLimit(UploadLogoValidator.MaxBytes + 64 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadLogo([FromQuery] Guid? companyId, IFormFile file)
    {
        if (file.Length is 0 or > UploadLogoValidator.MaxBytes)
        {
            return ToProblem(Error.Validation("branding.logo", "Logo must be 512 KB or smaller."));
        }

        using var buffer = new MemoryStream();
        await file.CopyToAsync(buffer, HttpContext.RequestAborted);
        return await Send(new UploadLogoCommand(companyId, file.FileName, file.ContentType, buffer.ToArray()));
    }

    [HttpGet("usage")]
    [HasPermission(Permission.CompanyUsageRead)]
    public Task<IActionResult> Usage([FromQuery] Guid? companyId) => Send(new GetCompanyUsageQuery(companyId));

    [HttpGet("audit-logs")]
    [HasPermission(Permission.CompanyAuditRead)]
    [FeatureGate(Feature.AuditLog)]
    public Task<IActionResult> AuditLogs([FromQuery] ListAuditLogsQuery query) => Send(query);
}
