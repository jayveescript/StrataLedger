using System.Collections.Frozen;
using MyApp.Domain.Enums;

namespace MyApp.Domain.Authorization;

/// <summary>Which roles each inviter may hand out. Nobody can invite a Super Admin through the tenant flow.</summary>
public static class InvitationPolicy
{
    private static readonly FrozenDictionary<UserRole, FrozenSet<UserRole>> Map =
        new Dictionary<UserRole, FrozenSet<UserRole>>
        {
            [UserRole.SuperAdmin] = new[] { UserRole.TenantAdmin, UserRole.Manager, UserRole.Viewer, UserRole.Member }.ToFrozenSet(),
            [UserRole.TenantAdmin] = new[] { UserRole.TenantAdmin, UserRole.Manager, UserRole.Viewer, UserRole.Member }.ToFrozenSet(),
            [UserRole.Manager] = new[] { UserRole.Member }.ToFrozenSet(),
        }.ToFrozenDictionary();

    public static bool CanInvite(UserRole inviter, UserRole invitee) =>
        Map.TryGetValue(inviter, out var allowed) && allowed.Contains(invitee);
}
