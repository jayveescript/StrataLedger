namespace StrataLedger.Domain.Enums;

/// <summary>Sellable product modules. Enabled per company by tier plus per-company overrides.</summary>
public enum Feature
{
    StrataPlans = 1,
    OwnerPortal,
    OwnerInvitations,
    CustomBranding,
    AuditLog,
    Documents,
    Levies,
    Expenses,
    Suppliers,
    Reports,
    RulesEngine,
    Agm,
    Complaints,
    CapitalWorks,
    CommissionRegister,
}
