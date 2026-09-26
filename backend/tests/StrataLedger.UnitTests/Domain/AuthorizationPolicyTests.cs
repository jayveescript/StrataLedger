using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.UnitTests.Domain;

public sealed class AuthorizationPolicyTests
{
    [Fact]
    public void SuperAdmin_has_every_permission() =>
        Assert.All(Enum.GetValues<Permission>(), p => Assert.True(RolePermissions.Has(UserRole.SuperAdmin, p)));

    [Theory]
    [InlineData(UserRole.Owner, Permission.PlansRead)]
    [InlineData(UserRole.Owner, Permission.CompanyUsersManage)]
    [InlineData(UserRole.Accountant, Permission.PlansWrite)]
    [InlineData(UserRole.StrataManager, Permission.CompanyBrandingManage)]
    [InlineData(UserRole.CompanyAdmin, Permission.PlatformCompaniesManage)]
    public void Roles_do_not_get_permissions_above_them(UserRole role, Permission permission) =>
        Assert.False(RolePermissions.Has(role, permission));

    [Theory]
    [InlineData(UserRole.Owner, Permission.PortalAccess)]
    [InlineData(UserRole.Accountant, Permission.CompanyAuditRead)]
    [InlineData(UserRole.StrataManager, Permission.OwnersInvite)]
    [InlineData(UserRole.CompanyAdmin, Permission.CompanyBrandingManage)]
    public void Roles_get_their_expected_permissions(UserRole role, Permission permission) =>
        Assert.True(RolePermissions.Has(role, permission));

    [Theory]
    [InlineData(UserRole.CompanyAdmin, UserRole.SuperAdmin, false)]
    [InlineData(UserRole.StrataManager, UserRole.CompanyAdmin, false)]
    [InlineData(UserRole.StrataManager, UserRole.Owner, true)]
    [InlineData(UserRole.Owner, UserRole.Owner, false)]
    [InlineData(UserRole.Accountant, UserRole.Owner, false)]
    [InlineData(UserRole.SuperAdmin, UserRole.CompanyAdmin, true)]
    public void Invitation_policy_limits_grantable_roles(UserRole inviter, UserRole invitee, bool expected) =>
        Assert.Equal(expected, InvitationPolicy.CanInvite(inviter, invitee));
}
