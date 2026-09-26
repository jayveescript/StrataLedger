using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using StrataLedger.Api.Infrastructure;
using StrataLedger.Application.Features.Files;

namespace StrataLedger.Api.Controllers;

/// <summary>Public, immutable assets (company logos) for the sign-in screen and branded emails.</summary>
[Route("api/v1/public/files")]
[AllowAnonymous]
public sealed class PublicFilesController : ApiControllerBase
{
    [HttpGet("{id:guid}")]
    [OutputCache(Duration = 3600)]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any)]
    public Task<IActionResult> Get(Guid id) =>
        Send(new GetPublicFileQuery(id), file => File(file.Content, file.ContentType));
}
