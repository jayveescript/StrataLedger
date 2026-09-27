using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyApp.Domain.Tenants;

namespace MyApp.Infrastructure.Persistence.Configurations;

internal sealed class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> b)
    {
        b.Property(c => c.Name).HasMaxLength(200).IsRequired();
        b.Property(c => c.Slug).HasMaxLength(220).IsRequired();
        b.HasIndex(c => c.Slug).IsUnique();
        b.Property(c => c.TaxId).HasMaxLength(20);
        b.Property(c => c.ContactName).HasMaxLength(200);
        b.Property(c => c.ContactEmail).HasMaxLength(256);
        b.Property(c => c.Phone).HasMaxLength(30);
        b.ComplexProperty(c => c.Branding, branding => branding.ToJson());
        b.HasMany(c => c.FeatureOverrides).WithOne().HasForeignKey(o => o.TenantId).OnDelete(DeleteBehavior.Cascade);
        b.Navigation(c => c.FeatureOverrides).AutoInclude(false);
    }
}

internal sealed class TenantFeatureOverrideConfiguration : IEntityTypeConfiguration<TenantFeatureOverride>
{
    public void Configure(EntityTypeBuilder<TenantFeatureOverride> b)
    {
        b.HasIndex(o => new { o.TenantId, o.Feature }).IsUnique();
        b.Property(o => o.Note).HasMaxLength(500);
    }
}

internal sealed class TierDefinitionConfiguration : IEntityTypeConfiguration<TierDefinition>
{
    public void Configure(EntityTypeBuilder<TierDefinition> b)
    {
        b.ToTable("tiers");
        b.HasIndex(t => t.Tier).IsUnique();
        b.Property(t => t.Name).HasMaxLength(60).IsRequired();
        b.Ignore(t => t.StorageQuotaBytes);
    }
}
