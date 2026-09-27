using MyApp.Domain.Authorization;
using MyApp.Domain.Enums;

namespace MyApp.UnitTests.Domain;

public sealed class AuthorizationPolicyTests
{
    [Fact]
    public void SuperAdmin_has_every_permission() =>
        Assert.All(Enum.GetValues<Permission>(), p => Assert.True(RolePermissions.Has(UserRole.SuperAdmin, p)));

    [Theory]
    [InlineData(UserRole.Member, Permission.ItemsRead)]
    [InlineData(UserRole.Member, Permission.TenantUsersManage)]
    [InlineData(UserRole.Viewer, Permission.ItemsWrite)]
    [InlineData(UserRole.Manager, Permission.TenantBrandingManage)]
    [InlineData(UserRole.TenantAdmin, Permission.PlatformTenantsManage)]
    public void Roles_do_not_get_permissions_above_them(UserRole role, Permission permission) =>
        Assert.False(RolePermissions.Has(role, permission));

    [Theory]
    [InlineData(UserRole.Member, Permission.PortalAccess)]
    [InlineData(UserRole.Viewer, Permission.TenantAuditRead)]
    [InlineData(UserRole.Manager, Permission.MembersInvite)]
    [InlineData(UserRole.TenantAdmin, Permission.TenantBrandingManage)]
    public void Roles_get_their_expected_permissions(UserRole role, Permission permission) =>
        Assert.True(RolePermissions.Has(role, permission));

    [Theory]
    [InlineData(UserRole.TenantAdmin, UserRole.SuperAdmin, false)]
    [InlineData(UserRole.Manager, UserRole.TenantAdmin, false)]
    [InlineData(UserRole.Manager, UserRole.Member, true)]
    [InlineData(UserRole.Member, UserRole.Member, false)]
    [InlineData(UserRole.Viewer, UserRole.Member, false)]
    [InlineData(UserRole.SuperAdmin, UserRole.TenantAdmin, true)]
    public void Invitation_policy_limits_grantable_roles(UserRole inviter, UserRole invitee, bool expected) =>
        Assert.Equal(expected, InvitationPolicy.CanInvite(inviter, invitee));
}
