using System.Linq.Expressions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Application.Common.Services;
using StrataLedger.Application.Features.Companies;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Files;

namespace StrataLedger.Application.Features.CompanyAdmin;

[RequiresPermission(Permission.CompanyBrandingManage)]
public sealed record GetBrandingQuery(Guid? CompanyId) : IQuery<BrandingDto>;

public sealed class GetBrandingHandler(ICurrentUser currentUser, IRepository<Company> companies, IAppUrls urls)
    : IRequestHandler<GetBrandingQuery, BrandingDto>
{
    public async Task<Result<BrandingDto>> Handle(GetBrandingQuery request, CancellationToken cancellationToken) =>
        await currentUser.ResolveCompany(request.CompanyId).BindAsync(async id =>
        {
            var branding = await companies.Query().Where(c => c.Id == id).Select(c => c.Branding).FirstOrDefaultAsync(cancellationToken);
            return branding is null ? Result<BrandingDto>.Failure(Error.NotFound("Company")) : BrandingDto.From(branding, urls);
        });
}

[RequiresPermission(Permission.CompanyBrandingManage), RequiresFeature(Feature.CustomBranding)]
public sealed record UpdateBrandingCommand(Guid? CompanyId, string DisplayName, string LogoMark,
    string PrimaryColor, string PrimaryForeground, string SecondaryColor, string SecondaryForeground,
    string SuccessColor, string WarningColor, string ErrorColor, string InfoColor,
    string TextPrimary, string TextSecondary, string TextMuted,
    string SurfaceBg, string SurfaceCard, string BorderColor) : ICommand<BrandingDto>;

public sealed class UpdateBrandingValidator : AbstractValidator<UpdateBrandingCommand>
{
    private const string Hex = "^#([0-9a-fA-F]{6})$";

    public UpdateBrandingValidator()
    {
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(80);
        RuleFor(x => x.LogoMark).NotEmpty().MaximumLength(3).Matches("^[A-Za-z0-9]+$");
        Expression<Func<UpdateBrandingCommand, string>>[] colors =
        [
            x => x.PrimaryColor, x => x.PrimaryForeground, x => x.SecondaryColor, x => x.SecondaryForeground,
            x => x.SuccessColor, x => x.WarningColor, x => x.ErrorColor, x => x.InfoColor, x => x.TextPrimary,
            x => x.TextSecondary, x => x.TextMuted, x => x.SurfaceBg, x => x.SurfaceCard, x => x.BorderColor,
        ];

        foreach (var color in colors)
        {
            RuleFor(color).NotEmpty().Matches(Hex).WithMessage("Colours must be 6-digit hex values such as #84cc16.");
        }
    }
}

public sealed class UpdateBrandingHandler(ICurrentUser currentUser, IRepository<Company> companies, IAppUrls urls)
    : IRequestHandler<UpdateBrandingCommand, BrandingDto>
{
    public async Task<Result<BrandingDto>> Handle(UpdateBrandingCommand r, CancellationToken cancellationToken) =>
        await currentUser.ResolveCompany(r.CompanyId).BindAsync(async id =>
        {
            var company = await companies.FindAsync(id, cancellationToken);
            if (company is null)
            {
                return Result<BrandingDto>.Failure(Error.NotFound("Company"));
            }

            var branding = new BrandSettings
            {
                DisplayName = r.DisplayName.Trim(), LogoMark = r.LogoMark.Trim().ToUpperInvariant(),
                LogoFileId = company.Branding.LogoFileId,
                PrimaryColor = r.PrimaryColor, PrimaryForeground = r.PrimaryForeground,
                SecondaryColor = r.SecondaryColor, SecondaryForeground = r.SecondaryForeground,
                SuccessColor = r.SuccessColor, WarningColor = r.WarningColor, ErrorColor = r.ErrorColor, InfoColor = r.InfoColor,
                TextPrimary = r.TextPrimary, TextSecondary = r.TextSecondary, TextMuted = r.TextMuted,
                SurfaceBg = r.SurfaceBg, SurfaceCard = r.SurfaceCard, BorderColor = r.BorderColor,
            };
            company.UpdateBranding(branding);
            return BrandingDto.From(branding, urls);
        });
}

[RequiresPermission(Permission.CompanyBrandingManage), RequiresFeature(Feature.CustomBranding)]
public sealed record UploadLogoCommand(Guid? CompanyId, string FileName, string ContentType, byte[] Content) : ICommand<BrandingDto>;

public sealed class UploadLogoValidator : AbstractValidator<UploadLogoCommand>
{
    public const int MaxBytes = 512 * 1024;

    public UploadLogoValidator()
    {
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Content).NotEmpty().Must(c => c.Length <= MaxBytes).WithMessage("Logo must be 512 KB or smaller.");
        RuleFor(x => x.Content).Must(c => ImageSniffer.Detect(c) is not null)
            .WithMessage("Logo must be a PNG, JPEG or WebP image.");
    }
}

public sealed class UploadLogoHandler(
    ICurrentUser currentUser,
    IRepository<Company> companies,
    IRepository<StoredFile> files,
    UsageLimits limits,
    IAppUrls urls) : IRequestHandler<UploadLogoCommand, BrandingDto>
{
    public async Task<Result<BrandingDto>> Handle(UploadLogoCommand request, CancellationToken cancellationToken)
    {
        var companyId = currentUser.ResolveCompany(request.CompanyId);
        if (companyId.IsFailure)
        {
            return companyId.Error!;
        }

        var quota = await limits.EnsureStorageAvailableAsync(companyId.Value, request.Content.LongLength, cancellationToken);
        if (quota.IsFailure)
        {
            return quota.Error!;
        }

        var company = (await companies.FindAsync(companyId.Value, cancellationToken))!;
        var previous = company.Branding.LogoFileId is { } oldId ? await files.FindAsync(oldId, cancellationToken) : null;
        if (previous is not null)
        {
            files.Remove(previous);
            company.TrackStorage(-previous.SizeBytes);
        }

        // Content type comes from the magic bytes, never from the client header.
        var file = new StoredFile(company.Id, Path.GetFileName(request.FileName), ImageSniffer.Detect(request.Content)!, request.Content, isPublic: true);
        files.Add(file);
        company.TrackStorage(file.SizeBytes);

        company.UpdateBranding(company.Branding.WithLogo(file.Id));

        return BrandingDto.From(company.Branding, urls);
    }
}

public static class ImageSniffer
{
    private static readonly (byte[] Magic, int Offset, string ContentType)[] Signatures =
    [
        ([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0, "image/png"),
        ([0xFF, 0xD8, 0xFF], 0, "image/jpeg"),
        ("WEBP"u8.ToArray(), 8, "image/webp"),
    ];

    /// <summary>SVG is intentionally unsupported: it can carry script.</summary>
    public static string? Detect(byte[] content) =>
        Signatures.FirstOrDefault(s => content.Length >= s.Offset + s.Magic.Length
            && content.AsSpan(s.Offset, s.Magic.Length).SequenceEqual(s.Magic)).ContentType;
}
