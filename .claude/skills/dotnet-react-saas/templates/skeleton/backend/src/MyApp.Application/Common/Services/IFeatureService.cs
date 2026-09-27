using MyApp.Domain.Enums;

namespace MyApp.Application.Common.Services;

public interface IFeatureService
{
    Task<IReadOnlySet<Feature>> GetEnabledFeaturesAsync(Guid tenantId, CancellationToken cancellationToken = default);

    async Task<bool> IsEnabledAsync(Guid tenantId, Feature feature, CancellationToken cancellationToken = default) =>
        (await GetEnabledFeaturesAsync(tenantId, cancellationToken)).Contains(feature);

    Task InvalidateAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
