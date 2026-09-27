using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;

namespace MyApp.UnitTests.Domain;

public sealed class TenantTests
{
    private static Tenant NewTenant() => Tenant.Create("Acme Strata Group", "acme", null, "Jo", "JO@ACME.COM", null, SubscriptionTier.Starter);

    [Fact]
    public void Create_normalises_input_and_derives_branding()
    {
        var tenant = NewTenant();
        Assert.Equal("jo@acme.com", tenant.ContactEmail);
        Assert.Equal("AS", tenant.Branding.LogoMark);
        Assert.Equal("Acme Strata Group", tenant.Branding.DisplayName);
    }

    [Fact]
    public void Suspending_revokes_all_sessions()
    {
        var tenant = NewTenant();
        var before = tenant.SessionVersion;
        tenant.ChangeStatus(TenantStatus.Suspended);
        Assert.Equal(before + 1, tenant.SessionVersion);
    }

    [Fact]
    public void Feature_override_is_upserted()
    {
        var tenant = NewTenant();
        tenant.SetFeatureOverride(Feature.Reports, true, null, "trial");
        tenant.SetFeatureOverride(Feature.Reports, false, null, "ended");

        var single = Assert.Single(tenant.FeatureOverrides);
        Assert.False(single.Enabled);
        Assert.Equal("ended", single.Note);
    }
}
