using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Identity;

namespace StrataLedger.Infrastructure.Persistence.Configurations;

internal sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> b)
    {
        b.ToTable("users");
        b.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
        b.Property(u => u.LastName).HasMaxLength(100).IsRequired();
        b.Ignore(u => u.FullName);
        b.Ignore(u => u.RequiresMfa);
        b.HasIndex(u => u.CompanyId);
        b.HasOne<Company>().WithMany().HasForeignKey(u => u.CompanyId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.Property(t => t.TokenHash).HasMaxLength(64).IsRequired();
        b.HasIndex(t => t.TokenHash).IsUnique();
        b.HasIndex(t => t.UserId);
        b.HasIndex(t => t.FamilyId);
        b.Property(t => t.IpAddress).HasMaxLength(64);
        b.Property(t => t.UserAgent).HasMaxLength(512);
        b.Property(t => t.RevokedReason).HasMaxLength(100);
        b.HasOne<ApplicationUser>().WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class PasswordHistoryConfiguration : IEntityTypeConfiguration<PasswordHistoryEntry>
{
    public void Configure(EntityTypeBuilder<PasswordHistoryEntry> b)
    {
        b.ToTable("password_history");
        b.HasIndex(p => new { p.UserId, p.CreatedAt });
        b.HasOne<ApplicationUser>().WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class InvitationConfiguration : IEntityTypeConfiguration<Invitation>
{
    public void Configure(EntityTypeBuilder<Invitation> b)
    {
        b.Property(i => i.Email).HasMaxLength(256).IsRequired();
        b.Property(i => i.FirstName).HasMaxLength(100);
        b.Property(i => i.LastName).HasMaxLength(100);
        b.Property(i => i.TokenHash).HasMaxLength(64).IsRequired();
        b.HasIndex(i => i.TokenHash).IsUnique();
        b.HasIndex(i => new { i.CompanyId, i.Email, i.Status });
        b.HasOne<Company>().WithMany().HasForeignKey(i => i.CompanyId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne<InvitationBatch>().WithMany().HasForeignKey(i => i.BatchId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class InvitationBatchConfiguration : IEntityTypeConfiguration<InvitationBatch>
{
    public void Configure(EntityTypeBuilder<InvitationBatch> b)
    {
        b.Property(x => x.FileName).HasMaxLength(255);
        b.HasOne<Company>().WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Cascade);
    }
}
