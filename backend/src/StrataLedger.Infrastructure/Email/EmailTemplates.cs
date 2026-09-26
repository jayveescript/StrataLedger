using System.Net;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Infrastructure.Email;

public sealed record RenderedEmail(string Subject, string Html, string Text);

/// <summary>
/// Company-branded transactional templates. Every model value is HTML-encoded; template text is static.
/// Templates are looked up from a dictionary rather than branched on.
/// </summary>
public static class EmailTemplates
{
    private sealed record Template(Func<IReadOnlyDictionary<string, string>, BrandSettings, string> Subject,
        Func<IReadOnlyDictionary<string, string>, BrandSettings, string[]> Paragraphs,
        string? ButtonLabel);

    private static readonly Dictionary<EmailTemplate, Template> Templates = new()
    {
        [EmailTemplate.Invitation] = new(
            (m, b) => $"You're invited to {m["company"]} on {b.DisplayName}",
            (m, _) =>
            [
                $"Hi {m["name"]},",
                $"{m["company"]} has invited you to join as {m["role"]}.",
                $"Click the button below to set your password and activate your account. This link expires in {m["expiresHours"]} hours and can only be used once.",
            ],
            "Accept invitation"),
        [EmailTemplate.PasswordReset] = new(
            (_, b) => $"Reset your {b.DisplayName} password",
            (m, _) =>
            [
                $"Hi {m["name"]},",
                "We received a request to reset your password. If this was you, use the button below.",
                "If you didn't request this, you can ignore this email — your password will not change.",
            ],
            "Reset password"),
        [EmailTemplate.PasswordChanged] = new(
            (_, b) => $"Your {b.DisplayName} password was changed",
            (m, _) =>
            [
                $"Hi {m["name"]},",
                "Your password was just changed and all other sessions were signed out.",
                "If you did not make this change, contact your administrator immediately.",
            ],
            null),
        [EmailTemplate.MfaEnabled] = new(
            (_, b) => $"Two-factor authentication enabled on {b.DisplayName}",
            (m, _) =>
            [
                $"Hi {m["name"]},",
                "Two-factor authentication is now protecting your account. Keep your recovery codes somewhere safe.",
            ],
            null),
    };

    public static RenderedEmail Render(EmailTemplate template, BrandSettings brand, IReadOnlyDictionary<string, string> model,
        string? logoUrl)
    {
        var t = Templates[template];
        var subject = t.Subject(model, brand);
        var paragraphs = t.Paragraphs(model, brand);
        var url = model.GetValueOrDefault("url");

        var text = string.Join("\n\n", paragraphs) + (url is null ? string.Empty : $"\n\n{url}") + $"\n\n— {brand.DisplayName}";
        var html = BuildHtml(brand, paragraphs, t.ButtonLabel, url, logoUrl);
        return new RenderedEmail(subject, html, text);
    }

    private static string BuildHtml(BrandSettings b, string[] paragraphs, string? buttonLabel, string? url, string? logoUrl)
    {
        string E(string s) => WebUtility.HtmlEncode(s);
        var header = logoUrl is null
            ? $"<div style=\"display:inline-block;background:{b.PrimaryColor};color:{b.PrimaryForeground};font-weight:700;border-radius:8px;padding:8px 12px\">{E(b.LogoMark)}</div>"
            : $"<img src=\"{E(logoUrl)}\" alt=\"{E(b.DisplayName)}\" style=\"max-height:40px\">";
        var body = string.Concat(paragraphs.Select(p => $"<p style=\"margin:0 0 16px;color:{b.TextPrimary}\">{E(p)}</p>"));
        var button = buttonLabel is null || url is null
            ? string.Empty
            : $"<p style=\"margin:24px 0\"><a href=\"{E(url)}\" style=\"background:{b.PrimaryColor};color:{b.PrimaryForeground};padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600\">{E(buttonLabel)}</a></p>"
              + $"<p style=\"font-size:12px;color:{b.TextMuted};word-break:break-all\">{E(url)}</p>";

        return $"""
            <!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Helvetica,Arial,sans-serif">
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
            <table width="560" cellpadding="0" cellspacing="0" style="background:{b.SurfaceCard};border:1px solid {b.BorderColor};border-radius:12px">
            <tr><td style="padding:24px 32px;border-bottom:1px solid {b.BorderColor}">{header}<span style="margin-left:12px;font-weight:600;color:{b.TextPrimary}">{E(b.DisplayName)}</span></td></tr>
            <tr><td style="padding:32px">{body}{button}</td></tr>
            </table>
            <p style="font-size:12px;color:#94a3b8">Sent by {E(b.DisplayName)} via StrataLedger</p>
            </td></tr></table></body></html>
            """;
    }
}
