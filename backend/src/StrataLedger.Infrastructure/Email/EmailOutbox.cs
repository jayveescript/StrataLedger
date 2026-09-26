using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Messaging;
using StrataLedger.Infrastructure.Persistence;

namespace StrataLedger.Infrastructure.Email;

/// <summary>Renders with the company's branding and stores the message in the outbox (same transaction as the caller).</summary>
public sealed class EmailOutbox(AppDbContext db, IAppUrls urls, TimeProvider clock) : IEmailOutbox
{
    public async Task EnqueueAsync(Guid? companyId, string toAddress, string toName, EmailTemplate template,
        IReadOnlyDictionary<string, string> model, CancellationToken cancellationToken = default)
    {
        var brand = companyId is { } id
            ? await db.Companies.AsNoTracking().Where(c => c.Id == id).Select(c => c.Branding).FirstOrDefaultAsync(cancellationToken)
            : null;
        brand ??= new BrandSettings();

        var logoUrl = brand.LogoFileId is { } fileId ? urls.PublicFile(fileId) : null;
        var rendered = EmailTemplates.Render(template, brand, model, logoUrl);
        db.EmailMessages.Add(new EmailMessage(companyId, toAddress, toName, rendered.Subject, rendered.Html, rendered.Text,
            clock.GetUtcNow()));
    }
}
