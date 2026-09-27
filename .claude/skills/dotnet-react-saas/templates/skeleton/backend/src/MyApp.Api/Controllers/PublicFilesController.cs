using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using MyApp.Api.Infrastructure;
using MyApp.Application.Features.Files;

namespace MyApp.Api.Controllers;

/// <summary>Public, immutable assets (tenant logos) for the sign-in screen and branded emails.</summary>
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
