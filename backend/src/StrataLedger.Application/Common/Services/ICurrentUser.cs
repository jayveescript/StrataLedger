using StrataLedger.Application.Common.Results;
using StrataLedger.Domain.Authorization;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Application.Common.Services;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid? UserId { get; }
    Guid? CompanyId { get; }
    UserRole? Role { get; }
    string? IpAddress { get; }
    string? UserAgent { get; }

    bool IsSuperAdmin => Role == UserRole.SuperAdmin;

    bool HasPermission(Permission permission) => Role is { } role && RolePermissions.Has(role, permission);

    Guid RequiredUserId => UserId ?? throw new InvalidOperationException("No authenticated user.");

    /// <summary>
    /// Resolves which company a request targets. Super Admin must name one; everyone else is pinned to their own and
    /// may not reach into another tenant by passing a different id.
    /// </summary>
    Result<Guid> ResolveCompany(Guid? requested) => (IsSuperAdmin, requested, CompanyId) switch
    {
        (true, { } id, _) => id,
        (true, null, _) => Error.Validation("company.required", "A company must be specified."),
        (false, null, { } own) => own,
        (false, { } id, { } own) when id == own => own,
        _ => Error.Forbidden(),
    };
}
