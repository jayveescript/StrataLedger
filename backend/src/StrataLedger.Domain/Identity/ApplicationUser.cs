using Microsoft.AspNetCore.Identity;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Domain.Identity;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public ApplicationUser()
    {
        Id = Guid.CreateVersion7();
        SecurityStamp = Guid.NewGuid().ToString("N");
    }

    /// <summary>Null only for platform Super Admins.</summary>
    public Guid? CompanyId { get; set; }

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsCommitteeMember { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
    public DateTimeOffset? PasswordChangedAt { get; set; }

    public string FullName => $"{FirstName} {LastName}".Trim();

    /// <summary>Staff and platform users must use MFA; owners may opt in.</summary>
    public bool RequiresMfa => Role != UserRole.Owner;
}
