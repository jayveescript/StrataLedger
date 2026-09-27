using StrataLedger.Domain.Enums;

namespace StrataLedger.Domain.Authorization;

/// <summary>Role-name constants for <c>[Authorize(Roles = ...)]</c> attributes.</summary>
public static class Roles
{
    public const string SuperAdmin = nameof(UserRole.SuperAdmin);
    public const string CompanyAdmin = nameof(UserRole.CompanyAdmin);
    public const string StrataManager = nameof(UserRole.StrataManager);
    public const string Accountant = nameof(UserRole.Accountant);
    public const string Owner = nameof(UserRole.Owner);

    public const string CompanyStaff = CompanyAdmin + "," + StrataManager + "," + Accountant;
    public const string CompanyAdmins = CompanyAdmin + "," + SuperAdmin;
    public const string AnyCompanyUser = CompanyStaff + "," + Owner;
}
