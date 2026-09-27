using MyApp.Domain.Enums;

namespace MyApp.Domain.Authorization;

/// <summary>Role-name constants for <c>[Authorize(Roles = ...)]</c> attributes.</summary>
public static class Roles
{
    public const string SuperAdmin = nameof(UserRole.SuperAdmin);
    public const string TenantAdmin = nameof(UserRole.TenantAdmin);
    public const string Manager = nameof(UserRole.Manager);
    public const string Viewer = nameof(UserRole.Viewer);
    public const string Member = nameof(UserRole.Member);

    public const string TenantStaff = TenantAdmin + "," + Manager + "," + Viewer;
    public const string TenantAdmins = TenantAdmin + "," + SuperAdmin;
    public const string AnyTenantUser = TenantStaff + "," + Member;
}
