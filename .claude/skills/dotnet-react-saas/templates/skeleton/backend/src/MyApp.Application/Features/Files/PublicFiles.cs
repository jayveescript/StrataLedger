using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Domain.Files;

namespace MyApp.Application.Features.Files;

public sealed record FileContent(string FileName, string ContentType, byte[] Content, DateTimeOffset CreatedAt);

/// <summary>Serves public assets such as logos (rendered in emails and on the sign-in page).</summary>
[AllowAnonymousRequest]
public sealed record GetPublicFileQuery(Guid Id) : IQuery<FileContent>;

public sealed class GetPublicFileHandler(IRepository<StoredFile> files) : IRequestHandler<GetPublicFileQuery, FileContent>
{
    public async Task<Result<FileContent>> Handle(GetPublicFileQuery request, CancellationToken cancellationToken)
    {
        var file = await files.Query()
            .Where(f => f.Id == request.Id && f.IsPublic)
            .Select(f => new FileContent(f.FileName, f.ContentType, f.Content, f.CreatedAt))
            .FirstOrDefaultAsync(cancellationToken);
        return file is null ? Error.NotFound("File") : file;
    }
}
