namespace MyApp.Domain.Enums;

public enum SubscriptionTier
{
    Starter = 1,
    Professional = 2,
    Enterprise = 3,
}

public enum TenantStatus
{
    Active = 1,
    Suspended = 2,
    Cancelled = 3,
}

public enum InvitationStatus
{
    Pending = 1,
    Accepted = 2,
    Revoked = 3,
    Expired = 4,
}

public enum AuditAction
{
    Created = 1,
    Updated,
    Deleted,
    LoginSucceeded,
    LoginFailed,
    LockedOut,
    MfaEnabled,
    MfaFailed,
    Logout,
    SessionRevoked,
    PasswordChanged,
    PasswordReset,
    InvitationSent,
    InvitationAccepted,
    ForcedLogout,
}

public enum EmailStatus
{
    Pending = 1,
    Sent,
    Failed,
}

public enum EmailTemplate
{
    Invitation = 1,
    PasswordReset,
    PasswordChanged,
    MfaEnabled,
}
