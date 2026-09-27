using MyApp.Domain.Common;

namespace MyApp.Domain.Items;

/// <summary>
/// Example tenant-owned aggregate. Copy this shape for real modules: private setters, factory + behaviour methods,
/// TenantEntity base (CompanyId-style tenant key, audit stamps, soft delete).
/// </summary>
public sealed class Item : TenantEntity
{
    private Item() { }

    public static Item Create(Guid tenantId, string name, string? description, decimal amount) => new()
    {
        TenantId = tenantId,
        Name = name.Trim(),
        Description = description?.Trim(),
        Amount = amount,
    };

    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal Amount { get; private set; }
    public ItemStatus Status { get; private set; } = ItemStatus.Active;

    public void Update(string name, string? description, decimal amount, ItemStatus status)
    {
        Name = name.Trim();
        Description = description?.Trim();
        Amount = amount;
        Status = status;
    }
}

public enum ItemStatus
{
    Active = 1,
    Archived,
}
