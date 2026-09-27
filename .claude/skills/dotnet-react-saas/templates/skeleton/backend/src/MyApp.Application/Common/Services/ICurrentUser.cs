using MyApp.Application.Common.Results;
using MyApp.Domain.Authorization;
using MyApp.Domain.Enums;

namespace MyApp.Application.Common.Services;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid? UserId { get; }
    Guid? TenantId { get; }
    UserRole? Role { get; }
    string? IpAddress { get; }
    string? UserAgent { get; }

    bool IsSuperAdmin => Role == UserRole.SuperAdmin;

    bool HasPermission(Permission permission) => Role is { } role && RolePermissions.Has(role, permission);

    Guid RequiredUserId => UserId ?? throw new InvalidOperationException("No authenticated user.");

    /// <summary>
    /// Resolves which tenant a request targets. Super Admin must name one; everyone else is pinned to their own and
    /// may not reach into another tenant by passing a different id.
    /// </summary>
    Result<Guid> ResolveTenant(Guid? requested) => (IsSuperAdmin, requested, TenantId) switch
    {
        (true, { } id, _) => id,
        (true, null, _) => Error.Validation("tenant.required", "A tenant must be specified."),
        (false, null, { } own) => own,
        (false, { } id, { } own) when id == own => own,
        _ => Error.Forbidden(),
    };
}
