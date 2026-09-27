using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyApp.Domain.Items;
using MyApp.Domain.Tenants;

namespace MyApp.Infrastructure.Persistence.Configurations;

internal sealed class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> b)
    {
        b.Property(i => i.Name).HasMaxLength(200).IsRequired();
        b.Property(i => i.Description).HasMaxLength(2000);
        b.Property(i => i.Amount).HasPrecision(14, 2);
        b.HasIndex(i => new { i.TenantId, i.Name });
        b.HasOne<Tenant>().WithMany().HasForeignKey(i => i.TenantId).OnDelete(DeleteBehavior.Restrict);
    }
}
