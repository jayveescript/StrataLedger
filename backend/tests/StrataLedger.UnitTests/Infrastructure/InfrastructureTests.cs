using System.Text;
using StrataLedger.Application.Features.CompanyAdmin;
using StrataLedger.Application.Features.Invitations;
using StrataLedger.Domain.Enums;
using StrataLedger.Infrastructure.Billing;
using StrataLedger.Infrastructure.Files;
using StrataLedger.Infrastructure.Security;

namespace StrataLedger.UnitTests.Infrastructure;

public sealed class InfrastructureTests
{
    [Theory]
    [InlineData(80, 0, 9_900)]
    [InlineData(100, 0, 9_900)]
    [InlineData(130, 30, 9_900 + 30 * 150)]
    public void Billing_charges_per_owner_beyond_the_included_allowance(int owners, int overage, int expectedCents)
    {
        var pricing = new ManualBillingProvider().Calculate(9_900, 100, 150, owners);
        Assert.Equal(overage, pricing.BillableOverageOwners);
        Assert.Equal(expectedCents, pricing.EstimatedMonthlyCents);
    }

    [Fact]
    public async Task Csv_parser_matches_loose_headers_and_neutralises_formulas()
    {
        const string csv = "E-mail,First Name,Surname,Role,Plan No,Lot\n=HYPERLINK(\"x\")@evil.com,+Jane,@Doe,Owner,PS1,Lot 2\n";
        var rows = await new InvitationFileParser().ParseAsync(new MemoryStream(Encoding.UTF8.GetBytes(csv)), "list.csv");

        var row = Assert.Single(rows);
        Assert.Equal(2, row.RowNumber);
        Assert.False(row.Email.StartsWith('='));
        Assert.Equal("Jane", row.FirstName);
        Assert.Equal("Doe", row.LastName);
        Assert.Equal("PS1", row.PlanNumber);
        Assert.Equal("Lot 2", row.LotNumber);
    }

    [Fact]
    public async Task Parser_rejects_unsupported_file_types() =>
        await Assert.ThrowsAsync<InvalidDataException>(() => new InvitationFileParser().ParseAsync(new MemoryStream(), "list.exe"));

    [Theory]
    [InlineData("Owner", UserRole.Owner)]
    [InlineData("strata manager", UserRole.StrataManager)]
    [InlineData("Auditor", UserRole.Accountant)]
    [InlineData("SuperAdmin", null)]
    public void Role_labels_parse_leniently_but_never_to_super_admin(string label, UserRole? expected) =>
        Assert.Equal(expected, RoleLabels.TryParse(label));

    [Fact]
    public void Image_sniffer_trusts_magic_bytes_not_extensions()
    {
        Assert.Equal("image/png", ImageSniffer.Detect([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0]));
        Assert.Null(ImageSniffer.Detect(Encoding.UTF8.GetBytes("<svg onload=alert(1)>")));
    }

    [Fact]
    public void Token_hashes_are_deterministic_and_tokens_are_unique()
    {
        var generator = new SecureTokenGenerator();
        var a = generator.Generate();
        Assert.NotEqual(a, generator.Generate());
        Assert.Equal(generator.Hash(a), generator.Hash(a));
        Assert.Equal(64, generator.Hash(a).Length);
    }
}
