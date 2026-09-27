using MyApp.Application.Common.Results;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;

namespace MyApp.UnitTests.Application;

public sealed class CurrentUserResolveTenantTests
{
    private static readonly Guid Own = Guid.NewGuid();
    private static readonly Guid Other = Guid.NewGuid();

    [Fact]
    public void Tenant_user_defaults_to_own_tenant() =>
        Assert.Equal(Own, User(UserRole.TenantAdmin, Own).ResolveTenant(null).Value);

    [Fact]
    public void Tenant_user_cannot_target_another_tenant() =>
        Assert.Equal(ErrorType.Forbidden, User(UserRole.TenantAdmin, Own).ResolveTenant(Other).Error!.Type);

    [Fact]
    public void Super_admin_must_name_a_tenant() =>
        Assert.Equal(ErrorType.Validation, User(UserRole.SuperAdmin, null).ResolveTenant(null).Error!.Type);

    [Fact]
    public void Super_admin_can_target_any_tenant() =>
        Assert.Equal(Other, User(UserRole.SuperAdmin, null).ResolveTenant(Other).Value);

    private static ICurrentUser User(UserRole role, Guid? tenantId) => new FakeUser(role, tenantId);

    private sealed record FakeUser(UserRole? Role, Guid? TenantId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId { get; } = Guid.NewGuid();
        public string? IpAddress => null;
        public string? UserAgent => null;
    }
}
