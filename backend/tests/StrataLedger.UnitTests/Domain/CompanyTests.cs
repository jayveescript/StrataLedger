using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;

namespace StrataLedger.UnitTests.Domain;

public sealed class CompanyTests
{
    private static Company NewCompany() => Company.Create("Acme Strata Group", "acme", null, "Jo", "JO@ACME.COM", null,
        [AustralianState.NSW, AustralianState.NSW], SubscriptionTier.Starter);

    [Fact]
    public void Create_normalises_input_and_derives_branding()
    {
        var company = NewCompany();
        Assert.Equal("jo@acme.com", company.ContactEmail);
        Assert.Single(company.States);
        Assert.Equal("AS", company.Branding.LogoMark);
        Assert.Equal("Acme Strata Group", company.Branding.DisplayName);
    }

    [Fact]
    public void Suspending_revokes_all_sessions()
    {
        var company = NewCompany();
        var before = company.SessionVersion;
        company.ChangeStatus(CompanyStatus.Suspended);
        Assert.Equal(before + 1, company.SessionVersion);
    }

    [Fact]
    public void Feature_override_is_upserted()
    {
        var company = NewCompany();
        company.SetFeatureOverride(Feature.Reports, true, null, "trial");
        company.SetFeatureOverride(Feature.Reports, false, null, "ended");

        var single = Assert.Single(company.FeatureOverrides);
        Assert.False(single.Enabled);
        Assert.Equal("ended", single.Note);
    }
}
