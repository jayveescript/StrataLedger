namespace MyApp.Domain.Enums;

/// <summary>Sellable product modules. Enabled per tenant by tier plus per-tenant overrides. Add your modules here.</summary>
public enum Feature
{
    Items = 1,
    MemberPortal,
    MemberInvitations,
    CustomBranding,
    AuditLog,
    Documents,
    Reports,
    ApiAccess,
}
