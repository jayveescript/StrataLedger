namespace MyApp.Domain.Enums;

/// <summary>Fine-grained capabilities. Roles are mapped to permission sets in <see cref="Authorization.RolePermissions"/>.</summary>
public enum Permission
{
    // Platform (Super Admin)
    PlatformTenantsManage = 1,
    PlatformTiersManage,
    PlatformFeaturesManage,
    PlatformSessionsManage,

    // Tenant administration
    TenantUsersRead = 100,
    TenantUsersManage,
    TenantUsersInvite,
    TenantBrandingManage,
    TenantAuditRead,
    TenantUsageRead,

    // Domain (replace with your own modules)
    ItemsRead = 200,
    ItemsWrite,
    MembersInvite,

    // Member portal
    PortalAccess = 300,
}
