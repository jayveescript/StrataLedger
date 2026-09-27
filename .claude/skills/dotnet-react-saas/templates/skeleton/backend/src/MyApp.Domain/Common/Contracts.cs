namespace MyApp.Domain.Common;

/// <summary>Row belongs to exactly one tenant; isolated by the tenant query filter and Postgres RLS.</summary>
public interface ITenantOwned
{
    Guid TenantId { get; }
}

/// <summary>Creation/modification stamps are populated by the persistence interceptor.</summary>
public interface IAuditable
{
    DateTimeOffset CreatedAt { get; set; }
    Guid? CreatedBy { get; set; }
    DateTimeOffset? UpdatedAt { get; set; }
    Guid? UpdatedBy { get; set; }
}

/// <summary>Deletes are converted to a flag so financial history is never lost.</summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTimeOffset? DeletedAt { get; set; }
}

public abstract class AuditableEntity : Entity, IAuditable
{
    public DateTimeOffset CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}

public abstract class TenantEntity : AuditableEntity, ITenantOwned, ISoftDeletable
{
    public Guid TenantId { get; protected set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}
