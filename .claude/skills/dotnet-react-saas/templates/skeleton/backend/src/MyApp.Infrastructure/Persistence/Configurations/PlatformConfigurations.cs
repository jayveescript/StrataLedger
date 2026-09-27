using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyApp.Domain.Audit;
using MyApp.Domain.Files;
using MyApp.Domain.Messaging;

namespace MyApp.Infrastructure.Persistence.Configurations;

internal sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.Property(a => a.EntityType).HasMaxLength(100).IsRequired();
        b.Property(a => a.EntityId).HasMaxLength(100);
        b.Property(a => a.Changes).HasColumnType("jsonb");
        b.Property(a => a.IpAddress).HasMaxLength(64);
        b.Property(a => a.UserAgent).HasMaxLength(512);
        b.HasIndex(a => new { a.TenantId, a.Timestamp });
        b.HasIndex(a => a.UserId);
    }
}

internal sealed class StoredFileConfiguration : IEntityTypeConfiguration<StoredFile>
{
    public void Configure(EntityTypeBuilder<StoredFile> b)
    {
        b.ToTable("files");
        b.Property(f => f.FileName).HasMaxLength(255).IsRequired();
        b.Property(f => f.ContentType).HasMaxLength(100).IsRequired();
        b.HasIndex(f => f.TenantId);
    }
}

internal sealed class EmailMessageConfiguration : IEntityTypeConfiguration<EmailMessage>
{
    public void Configure(EntityTypeBuilder<EmailMessage> b)
    {
        b.Property(e => e.ToAddress).HasMaxLength(256).IsRequired();
        b.Property(e => e.ToName).HasMaxLength(200);
        b.Property(e => e.Subject).HasMaxLength(300).IsRequired();
        b.Property(e => e.LastError).HasMaxLength(1000);
        b.HasIndex(e => new { e.Status, e.NextAttemptAt });
    }
}
