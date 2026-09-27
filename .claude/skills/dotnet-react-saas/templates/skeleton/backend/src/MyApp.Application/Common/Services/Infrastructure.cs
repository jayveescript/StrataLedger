using MyApp.Domain.Enums;

namespace MyApp.Application.Common.Services;

public interface IAuditWriter
{
    /// <summary>Persists a security event immediately in its own unit of work, even if the caller later fails.</summary>
    Task WriteSecurityEventAsync(AuditAction action, Guid? userId, Guid? tenantId, string? detail = null,
        CancellationToken cancellationToken = default);
}

public interface IPasswordBreachChecker
{
    /// <summary>Number of times the password appears in known breaches (0 when clean or when the check is unavailable).</summary>
    Task<int> GetBreachCountAsync(string password, CancellationToken cancellationToken = default);
}

public interface IEmailSender
{
    Task SendAsync(string toAddress, string toName, string subject, string htmlBody, string textBody,
        CancellationToken cancellationToken = default);
}

/// <summary>Queues a branded email in the transactional outbox.</summary>
public interface IEmailOutbox
{
    Task EnqueueAsync(Guid? tenantId, string toAddress, string toName, EmailTemplate template,
        IReadOnlyDictionary<string, string> model, CancellationToken cancellationToken = default);
}

public interface IAppUrls
{
    string AcceptInvitation(string token);
    string ResetPassword(string email, string token);
    string Login();
    string PublicFile(Guid fileId);
}

public interface ISecureTokenGenerator
{
    /// <summary>Cryptographically random URL-safe token.</summary>
    string Generate(int bytes = 32);

    string Hash(string token);
}

public sealed record InvitationFileRow(int RowNumber, string Email, string FirstName, string LastName, string Role);

public interface IInvitationFileParser
{
    Task<IReadOnlyList<InvitationFileRow>> ParseAsync(Stream content, string fileName, CancellationToken cancellationToken = default);
}

public sealed record UsagePricing(int IncludedSeats, int SeatCount, int BillableOverageSeats, int PerSeatOverageCents,
    int MonthlyBaseCents, int EstimatedMonthlyCents);

/// <summary>Billing seam. The launch implementation is invoice-by-hand; Stripe can be dropped in later.</summary>
public interface IBillingProvider
{
    UsagePricing Calculate(int monthlyBaseCents, int includedSeats, int perSeatOverageCents, int seatCount);
}
