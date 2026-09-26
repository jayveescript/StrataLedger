using Microsoft.AspNetCore.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Api.Authorization;

/// <summary>Requires a permission derived from the caller's role, e.g. <c>[HasPermission(Permission.PlansWrite)]</c>.</summary>
public sealed class HasPermissionAttribute(Permission permission)
    : AuthorizeAttribute(PolicyNames.Permission(permission));

/// <summary>Requires the caller's company to have a paid feature enabled (tier + Super Admin overrides).</summary>
public sealed class FeatureGateAttribute(Feature feature)
    : AuthorizeAttribute(PolicyNames.Feature(feature));

public static class PolicyNames
{
    public const string PermissionPrefix = "perm:";
    public const string FeaturePrefix = "feat:";

    public static string Permission(Permission permission) => PermissionPrefix + permission;

    public static string Feature(Feature feature) => FeaturePrefix + feature;
}
