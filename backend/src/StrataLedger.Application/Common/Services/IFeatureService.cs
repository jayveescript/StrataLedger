using StrataLedger.Domain.Enums;

namespace StrataLedger.Application.Common.Services;

public interface IFeatureService
{
    Task<IReadOnlySet<Feature>> GetEnabledFeaturesAsync(Guid companyId, CancellationToken cancellationToken = default);

    async Task<bool> IsEnabledAsync(Guid companyId, Feature feature, CancellationToken cancellationToken = default) =>
        (await GetEnabledFeaturesAsync(companyId, cancellationToken)).Contains(feature);

    Task InvalidateAsync(Guid companyId, CancellationToken cancellationToken = default);
}
