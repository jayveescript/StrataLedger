using System.Collections.Frozen;
using MyApp.Domain.Enums;
using static MyApp.Domain.Enums.Permission;

namespace MyApp.Domain.Authorization;

/// <summary>Single source of truth for what each role may do. Lookups replace role if/else chains.</summary>
public static class RolePermissions
{
    private static readonly Permission[] MemberPermissions = [PortalAccess];

    private static readonly Permission[] ViewerPermissions =
        [ItemsRead, TenantAuditRead];

    private static readonly Permission[] ManagerPermissions =
        [ItemsRead, ItemsWrite, MembersInvite, TenantUsersRead];

    private static readonly Permission[] TenantAdminPermissions =
    [
        .. ManagerPermissions,
        TenantUsersManage, TenantUsersInvite, TenantBrandingManage, TenantAuditRead, TenantUsageRead,
    ];

    private static readonly FrozenDictionary<UserRole, FrozenSet<Permission>> Map =
        new Dictionary<UserRole, FrozenSet<Permission>>
        {
            [UserRole.Member] = MemberPermissions.ToFrozenSet(),
            [UserRole.Viewer] = ViewerPermissions.ToFrozenSet(),
            [UserRole.Manager] = ManagerPermissions.ToFrozenSet(),
            [UserRole.TenantAdmin] = TenantAdminPermissions.ToFrozenSet(),
            [UserRole.SuperAdmin] = Enum.GetValues<Permission>().ToFrozenSet(),
        }.ToFrozenDictionary();

    public static IReadOnlySet<Permission> For(UserRole role) =>
        Map.TryGetValue(role, out var permissions) ? permissions : FrozenSet<Permission>.Empty;

    public static bool Has(UserRole role, Permission permission) => For(role).Contains(permission);
}
