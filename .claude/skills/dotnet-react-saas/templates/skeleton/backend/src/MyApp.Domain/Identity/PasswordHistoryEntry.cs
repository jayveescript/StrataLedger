using MyApp.Domain.Common;

namespace MyApp.Domain.Identity;

public sealed class PasswordHistoryEntry : Entity
{
    private PasswordHistoryEntry() { }

    public PasswordHistoryEntry(Guid userId, string passwordHash, DateTimeOffset createdAt)
    {
        UserId = userId;
        PasswordHash = passwordHash;
        CreatedAt = createdAt;
    }

    public Guid UserId { get; private set; }
    public string PasswordHash { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
}
