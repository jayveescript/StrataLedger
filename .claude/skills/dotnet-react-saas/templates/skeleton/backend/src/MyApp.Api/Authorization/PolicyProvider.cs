using System.Collections.Frozen;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;

namespace MyApp.Api.Authorization;

public sealed record PermissionRequirement(Permission Permission) : IAuthorizationRequirement;

public sealed record FeatureRequirement(Feature Feature) : IAuthorizationRequirement;

/// <summary>Builds "perm:X" / "feat:X" policies on demand instead of registering one per enum value.</summary>
public sealed class DynamicPolicyProvider(IOptions<AuthorizationOptions> options) : DefaultAuthorizationPolicyProvider(options)
{
    private static readonly FrozenDictionary<string, Func<string, IAuthorizationRequirement?>> Factories =
        new Dictionary<string, Func<string, IAuthorizationRequirement?>>
        {
            [PolicyNames.PermissionPrefix] = v => Enum.TryParse<Permission>(v, out var p) ? new PermissionRequirement(p) : null,
            [PolicyNames.FeaturePrefix] = v => Enum.TryParse<Feature>(v, out var f) ? new FeatureRequirement(f) : null,
        }.ToFrozenDictionary();

    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        var factory = Factories.FirstOrDefault(f => policyName.StartsWith(f.Key, StringComparison.Ordinal));
        var requirement = factory.Value?.Invoke(policyName[factory.Key.Length..]);

        return requirement is null
            ? await base.GetPolicyAsync(policyName)
            : new AuthorizationPolicyBuilder().RequireAuthenticatedUser().AddRequirements(requirement).Build();
    }
}

public sealed class PermissionHandler(ICurrentUser currentUser) : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (currentUser.HasPermission(requirement.Permission))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

public sealed class FeatureHandler(ICurrentUser currentUser, IFeatureService features) : AuthorizationHandler<FeatureRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, FeatureRequirement requirement)
    {
        var allowed = currentUser.IsSuperAdmin
            || (currentUser.TenantId is { } tenantId && await features.IsEnabledAsync(tenantId, requirement.Feature));

        if (allowed)
        {
            context.Succeed(requirement);
        }
    }
}
