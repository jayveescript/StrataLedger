using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Identity;
using StrataLedger.Domain.Strata;

namespace StrataLedger.Infrastructure.Persistence.Configurations;

internal sealed class StrataPlanConfiguration : IEntityTypeConfiguration<StrataPlan>
{
    public void Configure(EntityTypeBuilder<StrataPlan> b)
    {
        b.Property(p => p.Name).HasMaxLength(200).IsRequired();
        b.Property(p => p.PlanNumber).HasMaxLength(30).IsRequired();
        b.Property(p => p.Address).HasMaxLength(300).IsRequired();
        b.Property(p => p.AdminFundBalance).HasPrecision(14, 2);
        b.Property(p => p.CapitalWorksFundBalance).HasPrecision(14, 2);
        b.HasIndex(p => new { p.CompanyId, p.PlanNumber }).IsUnique().HasFilter("is_deleted = false");
        b.HasOne<Company>().WithMany().HasForeignKey(p => p.CompanyId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(p => p.Lots).WithOne(l => l.StrataPlan).HasForeignKey(l => l.StrataPlanId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class LotConfiguration : IEntityTypeConfiguration<Lot>
{
    public void Configure(EntityTypeBuilder<Lot> b)
    {
        b.Property(l => l.LotNumber).HasMaxLength(30).IsRequired();
        b.Property(l => l.UnitNumber).HasMaxLength(30);
        b.HasIndex(l => new { l.StrataPlanId, l.LotNumber }).IsUnique().HasFilter("is_deleted = false");
        b.HasMany(l => l.Ownerships).WithOne(o => o.Lot).HasForeignKey(o => o.LotId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class OwnerConfiguration : IEntityTypeConfiguration<Owner>
{
    public void Configure(EntityTypeBuilder<Owner> b)
    {
        b.Property(o => o.FirstName).HasMaxLength(100).IsRequired();
        b.Property(o => o.LastName).HasMaxLength(100).IsRequired();
        b.Property(o => o.Email).HasMaxLength(256).IsRequired();
        b.Property(o => o.Phone).HasMaxLength(30);
        b.Property(o => o.PostalAddress).HasMaxLength(300);
        b.Property(o => o.EntityName).HasMaxLength(200);
        b.HasIndex(o => new { o.CompanyId, o.Email }).IsUnique().HasFilter("is_deleted = false");
        b.HasIndex(o => o.UserId);
        b.HasOne<ApplicationUser>().WithMany().HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.SetNull);
        b.HasMany(o => o.Ownerships).WithOne(x => x.Owner).HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class LotOwnershipConfiguration : IEntityTypeConfiguration<LotOwnership>
{
    public void Configure(EntityTypeBuilder<LotOwnership> b)
    {
        b.Property(x => x.SharePercent).HasPrecision(5, 2);
        b.HasIndex(x => new { x.LotId, x.OwnerId }).IsUnique();
    }
}
