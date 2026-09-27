namespace StrataLedger.Domain.Enums;

/// <summary>Fine-grained capabilities. Roles are mapped to permission sets in <see cref="Authorization.RolePermissions"/>.</summary>
public enum Permission
{
    // Platform (Super Admin)
    PlatformCompaniesManage = 1,
    PlatformTiersManage,
    PlatformFeaturesManage,
    PlatformSessionsManage,

    // Company administration
    CompanyUsersRead = 100,
    CompanyUsersManage,
    CompanyUsersInvite,
    CompanyBrandingManage,
    CompanyAuditRead,
    CompanyUsageRead,

    // Strata domain
    PlansRead = 200,
    PlansWrite,
    LotsRead,
    LotsWrite,
    OwnersRead,
    OwnersWrite,
    OwnersInvite,

    // Owner portal
    PortalAccess = 300,
}
