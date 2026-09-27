using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Enums;

namespace StrataLedger.UnitTests.Application;

public sealed class CurrentUserResolveCompanyTests
{
    private static readonly Guid Own = Guid.NewGuid();
    private static readonly Guid Other = Guid.NewGuid();

    [Fact]
    public void Tenant_user_defaults_to_own_company() =>
        Assert.Equal(Own, User(UserRole.CompanyAdmin, Own).ResolveCompany(null).Value);

    [Fact]
    public void Tenant_user_cannot_target_another_company() =>
        Assert.Equal(ErrorType.Forbidden, User(UserRole.CompanyAdmin, Own).ResolveCompany(Other).Error!.Type);

    [Fact]
    public void Super_admin_must_name_a_company() =>
        Assert.Equal(ErrorType.Validation, User(UserRole.SuperAdmin, null).ResolveCompany(null).Error!.Type);

    [Fact]
    public void Super_admin_can_target_any_company() =>
        Assert.Equal(Other, User(UserRole.SuperAdmin, null).ResolveCompany(Other).Value);

    private static ICurrentUser User(UserRole role, Guid? companyId) => new FakeUser(role, companyId);

    private sealed record FakeUser(UserRole? Role, Guid? CompanyId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId { get; } = Guid.NewGuid();
        public string? IpAddress => null;
        public string? UserAgent => null;
    }
}
