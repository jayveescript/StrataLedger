using MyApp.Domain.Common;

namespace MyApp.Domain.Files;

public sealed class StoredFile : AuditableEntity
{
    private StoredFile() { }

    public StoredFile(Guid? tenantId, string fileName, string contentType, byte[] content, bool isPublic)
    {
        TenantId = tenantId;
        FileName = fileName;
        ContentType = contentType;
        Content = content;
        SizeBytes = content.LongLength;
        IsPublic = isPublic;
    }

    public Guid? TenantId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public byte[] Content { get; private set; } = [];
    public long SizeBytes { get; private set; }

    /// <summary>Public files (logos) can be fetched without auth so they render in emails.</summary>
    public bool IsPublic { get; private set; }
}
