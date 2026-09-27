using MyApp.Domain.Common;
using MyApp.Domain.Enums;

namespace MyApp.Domain.Identity;

/// <summary>Single-use sign-up invitation. The raw token is only ever emailed; we persist its hash.</summary>
public sealed class Invitation : AuditableEntity, ITenantOwned
{
    private Invitation() { }

    public Invitation(Guid tenantId, Guid? batchId, string email, string firstName, string lastName, UserRole role,
        string tokenHash, DateTimeOffset expiresAt)
    {
        TenantId = tenantId;
        BatchId = batchId;
        Email = email.Trim().ToLowerInvariant();
        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Role = role;
        TokenHash = tokenHash;
        ExpiresAt = expiresAt;
    }

    public Guid TenantId { get; private set; }
    public Guid? BatchId { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; private set; }
    public InvitationStatus Status { get; private set; } = InvitationStatus.Pending;
    public DateTimeOffset? AcceptedAt { get; private set; }
    public int SendCount { get; private set; }
    public DateTimeOffset? LastSentAt { get; private set; }

    public bool CanBeAccepted(DateTimeOffset now) => Status == InvitationStatus.Pending && ExpiresAt > now;

    public void MarkSent(DateTimeOffset now)
    {
        SendCount++;
        LastSentAt = now;
    }

    public void Reissue(string tokenHash, DateTimeOffset expiresAt)
    {
        TokenHash = tokenHash;
        ExpiresAt = expiresAt;
        Status = InvitationStatus.Pending;
    }

    public void Accept(DateTimeOffset now)
    {
        Status = InvitationStatus.Accepted;
        AcceptedAt = now;
    }

    public void Revoke() => Status = InvitationStatus.Revoked;

    public void Expire() => Status = InvitationStatus.Expired;
}
