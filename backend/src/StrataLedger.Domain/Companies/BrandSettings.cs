namespace StrataLedger.Domain.Companies;

/// <summary>
/// White-label tokens applied to the web app (as CSS variables) and to outgoing email.
/// Defaults mirror the prototype's branding.json.
/// </summary>
public sealed class BrandSettings
{
    public string DisplayName { get; set; } = "StrataLedger";
    public string LogoMark { get; set; } = "SL";
    public Guid? LogoFileId { get; set; }

    public string PrimaryColor { get; set; } = "#84cc16";
    public string PrimaryForeground { get; set; } = "#1a2e05";
    public string SecondaryColor { get; set; } = "#d1d5db";
    public string SecondaryForeground { get; set; } = "#111827";
    public string SuccessColor { get; set; } = "#16a34a";
    public string WarningColor { get; set; } = "#d97706";
    public string ErrorColor { get; set; } = "#dc2626";
    public string InfoColor { get; set; } = "#2563eb";
    public string TextPrimary { get; set; } = "#0f172a";
    public string TextSecondary { get; set; } = "#475569";
    public string TextMuted { get; set; } = "#94a3b8";
    public string SurfaceBg { get; set; } = "#ffffff";
    public string SurfaceCard { get; set; } = "#ffffff";
    public string BorderColor { get; set; } = "#e2e8f0";

    public static BrandSettings Default(string companyName) => new()
    {
        DisplayName = companyName,
        LogoMark = BuildMark(companyName),
    };

    public BrandSettings WithLogo(Guid? logoFileId)
    {
        var copy = (BrandSettings)MemberwiseClone();
        copy.LogoFileId = logoFileId;
        return copy;
    }

    private static string BuildMark(string name)
    {
        var initials = name.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => char.IsLetter(w[0]))
            .Take(2)
            .Select(w => char.ToUpperInvariant(w[0]));
        var mark = new string(initials.ToArray());
        return mark.Length == 0 ? "SL" : mark;
    }
}
