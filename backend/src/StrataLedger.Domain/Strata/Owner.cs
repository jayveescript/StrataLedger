using StrataLedger.Domain.Common;

namespace StrataLedger.Domain.Strata;

public sealed class Owner : TenantEntity
{
    private Owner() { }

    public static Owner Create(Guid companyId, string firstName, string lastName, string email, string? phone,
        string? postalAddress, string? entityName) => new()
    {
        CompanyId = companyId,
        FirstName = firstName.Trim(),
        LastName = lastName.Trim(),
        Email = email.Trim().ToLowerInvariant(),
        Phone = phone?.Trim(),
        PostalAddress = postalAddress?.Trim(),
        EntityName = entityName?.Trim(),
    };

    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? PostalAddress { get; private set; }

    /// <summary>Company / trust name when the owner is not an individual.</summary>
    public string? EntityName { get; private set; }

    /// <summary>Linked portal login once the owner accepts an invitation.</summary>
    public Guid? UserId { get; private set; }

    public List<LotOwnership> Ownerships { get; private set; } = [];

    public void Update(string firstName, string lastName, string email, string? phone, string? postalAddress, string? entityName)
    {
        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Email = email.Trim().ToLowerInvariant();
        Phone = phone?.Trim();
        PostalAddress = postalAddress?.Trim();
        EntityName = entityName?.Trim();
    }

    public void LinkUser(Guid userId) => UserId = userId;
}
