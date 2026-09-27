using System.Reflection;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;

namespace MyApp.Application.Common.Behaviors;

/// <summary>
/// Second line of defence behind the controller attributes: every request is denied unless it is explicitly
/// anonymous or the caller is authenticated and holds the declared permissions and features.
/// </summary>
public sealed class AuthorizationBehavior<TRequest, TResult>(ICurrentUser currentUser, IFeatureService features)
    : IPipelineBehavior<TRequest, TResult> where TRequest : IRequest<TResult>
{
    private static readonly bool AllowAnonymous = typeof(TRequest).IsDefined(typeof(AllowAnonymousRequestAttribute));

    private static readonly Permission[] Permissions = typeof(TRequest)
        .GetCustomAttributes<RequiresPermissionAttribute>().Select(a => a.Permission).ToArray();

    private static readonly Feature[] Features = typeof(TRequest)
        .GetCustomAttributes<RequiresFeatureAttribute>().Select(a => a.Feature).ToArray();

    public async Task<Result<TResult>> Handle(TRequest request, RequestHandlerDelegate<TResult> next, CancellationToken cancellationToken)
    {
        if (AllowAnonymous)
        {
            return await next();
        }

        if (!currentUser.IsAuthenticated)
        {
            return Error.Unauthorized();
        }

        if (!Permissions.All(currentUser.HasPermission))
        {
            return Error.Forbidden();
        }

        var missingFeature = await FindMissingFeatureAsync(cancellationToken);
        return missingFeature is { } feature
            ? Error.FeatureDisabled(feature.ToString())
            : await next();
    }

    private async Task<Feature?> FindMissingFeatureAsync(CancellationToken cancellationToken)
    {
        if (Features.Length == 0 || currentUser.IsSuperAdmin || currentUser.TenantId is not { } tenantId)
        {
            return null;
        }

        var enabled = await features.GetEnabledFeaturesAsync(tenantId, cancellationToken);
        return Features.Cast<Feature?>().FirstOrDefault(f => !enabled.Contains(f!.Value));
    }
}
