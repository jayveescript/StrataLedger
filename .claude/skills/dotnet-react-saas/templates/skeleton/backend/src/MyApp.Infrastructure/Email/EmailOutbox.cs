using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Services;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Messaging;
using MyApp.Infrastructure.Persistence;

namespace MyApp.Infrastructure.Email;

/// <summary>Renders with the tenant's branding and stores the message in the outbox (same transaction as the caller).</summary>
public sealed class EmailOutbox(AppDbContext db, IAppUrls urls, TimeProvider clock) : IEmailOutbox
{
    public async Task EnqueueAsync(Guid? tenantId, string toAddress, string toName, EmailTemplate template,
        IReadOnlyDictionary<string, string> model, CancellationToken cancellationToken = default)
    {
        var brand = tenantId is { } id
            ? await db.Tenants.AsNoTracking().Where(c => c.Id == id).Select(c => c.Branding).FirstOrDefaultAsync(cancellationToken)
            : null;
        brand ??= new BrandSettings();

        var logoUrl = brand.LogoFileId is { } fileId ? urls.PublicFile(fileId) : null;
        var rendered = EmailTemplates.Render(template, brand, model, logoUrl);
        db.EmailMessages.Add(new EmailMessage(tenantId, toAddress, toName, rendered.Subject, rendered.Html, rendered.Text,
            clock.GetUtcNow()));
    }
}
