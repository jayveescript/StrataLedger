using MyApp.Domain.Common;
using MyApp.Domain.Enums;

namespace MyApp.Domain.Messaging;

/// <summary>Transactional outbox row. Written in the same transaction as the business change, delivered by a worker.</summary>
public sealed class EmailMessage : Entity
{
    private EmailMessage() { }

    public EmailMessage(Guid? tenantId, string toAddress, string toName, string subject, string htmlBody,
        string textBody, DateTimeOffset createdAt)
    {
        TenantId = tenantId;
        ToAddress = toAddress;
        ToName = toName;
        Subject = subject;
        HtmlBody = htmlBody;
        TextBody = textBody;
        CreatedAt = createdAt;
        NextAttemptAt = createdAt;
    }

    public Guid? TenantId { get; private set; }
    public string ToAddress { get; private set; } = string.Empty;
    public string ToName { get; private set; } = string.Empty;
    public string Subject { get; private set; } = string.Empty;
    public string HtmlBody { get; private set; } = string.Empty;
    public string TextBody { get; private set; } = string.Empty;
    public EmailStatus Status { get; private set; } = EmailStatus.Pending;
    public int Attempts { get; private set; }
    public string? LastError { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset NextAttemptAt { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }

    public const int MaxAttempts = 6;

    public void MarkSent(DateTimeOffset now)
    {
        Status = EmailStatus.Sent;
        SentAt = now;
        Attempts++;
        LastError = null;
    }

    public void MarkFailed(DateTimeOffset now, string error)
    {
        Attempts++;
        LastError = error.Length > 1000 ? error[..1000] : error;
        Status = Attempts >= MaxAttempts ? EmailStatus.Failed : EmailStatus.Pending;
        NextAttemptAt = now.AddSeconds(Math.Pow(2, Attempts) * 15);
    }
}
