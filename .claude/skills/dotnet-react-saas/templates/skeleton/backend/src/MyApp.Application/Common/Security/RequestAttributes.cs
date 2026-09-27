using MyApp.Domain.Enums;

namespace MyApp.Application.Common.Security;

/// <summary>Caller must hold every listed permission (derived from their role).</summary>
[AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
public sealed class RequiresPermissionAttribute(Permission permission) : Attribute
{
    public Permission Permission { get; } = permission;
}

/// <summary>The caller's tenant must have this feature enabled (tier + overrides). Super Admin bypasses.</summary>
[AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
public sealed class RequiresFeatureAttribute(Feature feature) : Attribute
{
    public Feature Feature { get; } = feature;
}

/// <summary>Request can run without an authenticated user (login, invitation acceptance, password reset).</summary>
[AttributeUsage(AttributeTargets.Class)]
public sealed class AllowAnonymousRequestAttribute : Attribute;

/// <summary>Command manages its own persistence (e.g. must record failed logins even when it returns failure).</summary>
[AttributeUsage(AttributeTargets.Class)]
public sealed class NonTransactionalAttribute : Attribute;
