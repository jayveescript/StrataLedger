using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyApp.Api.Authorization;
using MyApp.Api.Infrastructure;
using MyApp.Application.Common.Results;
using MyApp.Application.Features.TenantAdmin;
using MyApp.Application.Features.Tenants;
using MyApp.Domain.Authorization;
using MyApp.Domain.Enums;

namespace MyApp.Api.Controllers.Tenant;

/// <summary>Branding, usage/billing and audit trail for a tenant.</summary>
[Route("api/v1/tenant")]
[Authorize(Roles = $"{Roles.TenantAdmins},{Roles.Viewer}")]
public sealed class TenantSettingsController : ApiControllerBase
{
    [HttpGet("branding")]
    [HasPermission(Permission.TenantBrandingManage)]
    public Task<IActionResult> GetBranding([FromQuery] Guid? tenantId) => Send(new GetBrandingQuery(tenantId));

    [HttpPut("branding")]
    [HasPermission(Permission.TenantBrandingManage)]
    [FeatureGate(Feature.CustomBranding)]
    public Task<IActionResult> UpdateBranding([FromQuery] Guid? tenantId, [FromBody] UpdateBrandingCommand command) =>
        Send(command with { TenantId = tenantId });

    [HttpPost("branding/logo")]
    [HasPermission(Permission.TenantBrandingManage)]
    [FeatureGate(Feature.CustomBranding)]
    [RequestSizeLimit(UploadLogoValidator.MaxBytes + 64 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadLogo([FromQuery] Guid? tenantId, IFormFile file)
    {
        if (file.Length is 0 or > UploadLogoValidator.MaxBytes)
        {
            return ToProblem(Error.Validation("branding.logo", "Logo must be 512 KB or smaller."));
        }

        using var buffer = new MemoryStream();
        await file.CopyToAsync(buffer, HttpContext.RequestAborted);
        return await Send(new UploadLogoCommand(tenantId, file.FileName, file.ContentType, buffer.ToArray()));
    }

    [HttpGet("usage")]
    [HasPermission(Permission.TenantUsageRead)]
    public Task<IActionResult> Usage([FromQuery] Guid? tenantId) => Send(new GetTenantUsageQuery(tenantId));

    [HttpGet("audit-logs")]
    [HasPermission(Permission.TenantAuditRead)]
    [FeatureGate(Feature.AuditLog)]
    public Task<IActionResult> AuditLogs([FromQuery] ListAuditLogsQuery query) => Send(query);
}
