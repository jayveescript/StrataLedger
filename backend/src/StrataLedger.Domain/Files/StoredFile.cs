using StrataLedger.Domain.Common;

namespace StrataLedger.Domain.Files;

public sealed class StoredFile : AuditableEntity
{
    private StoredFile() { }

    public StoredFile(Guid? companyId, string fileName, string contentType, byte[] content, bool isPublic)
    {
        CompanyId = companyId;
        FileName = fileName;
        ContentType = contentType;
        Content = content;
        SizeBytes = content.LongLength;
        IsPublic = isPublic;
    }

    public Guid? CompanyId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public byte[] Content { get; private set; } = [];
    public long SizeBytes { get; private set; }

    /// <summary>Public files (logos) can be fetched without auth so they render in emails.</summary>
    public bool IsPublic { get; private set; }
}
