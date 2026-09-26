using System.Collections.Frozen;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Domain.Authorization;

/// <summary>Which roles each inviter may hand out. Nobody can invite a Super Admin through the tenant flow.</summary>
public static class InvitationPolicy
{
    private static readonly FrozenDictionary<UserRole, FrozenSet<UserRole>> Map =
        new Dictionary<UserRole, FrozenSet<UserRole>>
        {
            [UserRole.SuperAdmin] = new[] { UserRole.CompanyAdmin, UserRole.StrataManager, UserRole.Accountant, UserRole.Owner }.ToFrozenSet(),
            [UserRole.CompanyAdmin] = new[] { UserRole.CompanyAdmin, UserRole.StrataManager, UserRole.Accountant, UserRole.Owner }.ToFrozenSet(),
            [UserRole.StrataManager] = new[] { UserRole.Owner }.ToFrozenSet(),
        }.ToFrozenDictionary();

    public static bool CanInvite(UserRole inviter, UserRole invitee) =>
        Map.TryGetValue(inviter, out var allowed) && allowed.Contains(invitee);
}
