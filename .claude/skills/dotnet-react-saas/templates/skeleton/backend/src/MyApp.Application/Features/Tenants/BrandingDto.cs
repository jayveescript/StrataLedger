using MyApp.Application.Common.Services;
using MyApp.Domain.Tenants;

namespace MyApp.Application.Features.Tenants;

public sealed record BrandingDto(
    string DisplayName, string LogoMark, string? LogoUrl,
    string PrimaryColor, string PrimaryForeground, string SecondaryColor, string SecondaryForeground,
    string SuccessColor, string WarningColor, string ErrorColor, string InfoColor,
    string TextPrimary, string TextSecondary, string TextMuted,
    string SurfaceBg, string SurfaceCard, string BorderColor)
{
    public static BrandingDto From(BrandSettings b, IAppUrls urls) => new(
        b.DisplayName, b.LogoMark, b.LogoFileId is { } id ? urls.PublicFile(id) : null,
        b.PrimaryColor, b.PrimaryForeground, b.SecondaryColor, b.SecondaryForeground,
        b.SuccessColor, b.WarningColor, b.ErrorColor, b.InfoColor,
        b.TextPrimary, b.TextSecondary, b.TextMuted,
        b.SurfaceBg, b.SurfaceCard, b.BorderColor);

    public static BrandingDto Platform(IAppUrls urls) => From(new BrandSettings(), urls);
}
