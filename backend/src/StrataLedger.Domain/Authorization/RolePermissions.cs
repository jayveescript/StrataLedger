using System.Collections.Frozen;
using StrataLedger.Domain.Enums;
using static StrataLedger.Domain.Enums.Permission;

namespace StrataLedger.Domain.Authorization;

/// <summary>Single source of truth for what each role may do. Lookups replace role if/else chains.</summary>
public static class RolePermissions
{
    private static readonly Permission[] OwnerPermissions = [PortalAccess];

    private static readonly Permission[] AccountantPermissions =
        [PlansRead, LotsRead, OwnersRead, CompanyAuditRead];

    private static readonly Permission[] ManagerPermissions =
        [PlansRead, PlansWrite, LotsRead, LotsWrite, OwnersRead, OwnersWrite, OwnersInvite, CompanyUsersRead];

    private static readonly Permission[] CompanyAdminPermissions =
    [
        .. ManagerPermissions,
        CompanyUsersManage, CompanyUsersInvite, CompanyBrandingManage, CompanyAuditRead, CompanyUsageRead,
    ];

    private static readonly FrozenDictionary<UserRole, FrozenSet<Permission>> Map =
        new Dictionary<UserRole, FrozenSet<Permission>>
        {
            [UserRole.Owner] = OwnerPermissions.ToFrozenSet(),
            [UserRole.Accountant] = AccountantPermissions.ToFrozenSet(),
            [UserRole.StrataManager] = ManagerPermissions.ToFrozenSet(),
            [UserRole.CompanyAdmin] = CompanyAdminPermissions.ToFrozenSet(),
            [UserRole.SuperAdmin] = Enum.GetValues<Permission>().ToFrozenSet(),
        }.ToFrozenDictionary();

    public static IReadOnlySet<Permission> For(UserRole role) =>
        Map.TryGetValue(role, out var permissions) ? permissions : FrozenSet<Permission>.Empty;

    public static bool Has(UserRole role, Permission permission) => For(role).Contains(permission);
}
