// DTOs mirrored from the .NET API. Enums are serialised as strings.

export type UserRole = 'Member' | 'Viewer' | 'Manager' | 'TenantAdmin' | 'SuperAdmin'
export type SubscriptionTier = 'Starter' | 'Professional' | 'Enterprise'
export type TenantStatus = 'Active' | 'Suspended' | 'Cancelled'
export type InvitationStatus = 'Pending' | 'Accepted' | 'Revoked' | 'Expired'
export type SignInStep = 'Completed' | 'MfaRequired' | 'MfaEnrollmentRequired'

export type Permission =
  | 'PlatformTenantsManage' | 'PlatformTiersManage' | 'PlatformFeaturesManage' | 'PlatformSessionsManage'
  | 'TenantUsersRead' | 'TenantUsersManage' | 'TenantUsersInvite' | 'TenantBrandingManage' | 'TenantAuditRead'
  | 'TenantUsageRead' | 'ItemsRead' | 'ItemsWrite' | 'MembersInvite' | 'PortalAccess'

export type Feature =
  | 'Items' | 'MemberPortal' | 'MemberInvitations' | 'CustomBranding' | 'AuditLog' | 'Documents' | 'Reports' | 'ApiAccess'

export const ALL_FEATURES: Feature[] = [
  'Items', 'MemberPortal', 'MemberInvitations', 'CustomBranding', 'AuditLog', 'Documents', 'Reports', 'ApiAccess',
]
export const TIERS: SubscriptionTier[] = ['Starter', 'Professional', 'Enterprise']

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface Branding {
  displayName: string
  logoMark: string
  logoUrl: string | null
  primaryColor: string
  primaryForeground: string
  secondaryColor: string
  secondaryForeground: string
  successColor: string
  warningColor: string
  errorColor: string
  infoColor: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  surfaceBg: string
  surfaceCard: string
  borderColor: string
}

export interface AuthResponse {
  step: SignInStep
  accessToken: string | null
  accessTokenExpiresAt: string | null
  mfaToken: string | null
}

export interface MfaSetup {
  sharedKey: string
  authenticatorUri: string
}

export interface MfaConfirmResponse {
  recoveryCodes: string[]
  signIn: AuthResponse | null
}

export interface Me {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isCommitteeMember: boolean
  mfaEnabled: boolean
  tenant: { id: string; name: string; tier: SubscriptionTier; status: TenantStatus } | null
  permissions: Permission[]
  features: Feature[]
  branding: Branding
}

export interface InvitationPreview {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  tenantName: string
  branding: Branding
  expiresAt: string
  requiresMfa: boolean
}

export interface Session {
  id: string
  createdAt: string
  lastUsedAt: string
  expiresAt: string
  ipAddress: string | null
  userAgent: string | null
}

export interface UsagePricing {
  includedSeats: number
  seatCount: number
  billableOverageSeats: number
  perSeatOverageCents: number
  monthlyBaseCents: number
  estimatedMonthlyCents: number
}

export interface Usage {
  tier: SubscriptionTier
  tierName: string
  items: number
  maxItems: number | null
  storageUsedBytes: number
  storageQuotaBytes: number
  pricing: UsagePricing
}

export interface TenantListItem {
  id: string
  name: string
  slug: string
  taxId: string | null
  tier: SubscriptionTier
  status: TenantStatus
  contactEmail: string
  itemCount: number
  userCount: number
  createdAt: string
}

export interface TenantDetail {
  id: string
  name: string
  slug: string
  taxId: string | null
  contactName: string
  contactEmail: string
  phone: string | null
  tier: SubscriptionTier
  status: TenantStatus
  createdAt: string
  branding: Branding
  usage: Usage
}

export interface TenantInput {
  name: string
  taxId: string | null
  contactName: string
  contactEmail: string
  phone: string | null
}

export interface Tier {
  tier: SubscriptionTier
  name: string
  features: Feature[]
  maxItems: number | null
  storageQuotaMb: number
  includedSeats: number
  perSeatOverageCents: number
  monthlyPriceCents: number
}

export interface FeatureAccess {
  feature: Feature
  includedInTier: boolean
  overrideEnabled: boolean | null
  overrideExpiresAt: string | null
  overrideNote: string | null
  effective: boolean
}

export interface TenantUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isCommitteeMember: boolean
  isActive: boolean
  mfaEnabled: boolean
  isLockedOut: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface InvitationRowInput {
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

export interface InvitationRowPreview {
  rowNumber: number
  email: string
  firstName: string
  lastName: string
  role: string
  parsedRole: UserRole | null
  errors: string[]
  isValid: boolean
}

export interface InvitationUploadPreview {
  fileName: string
  totalRows: number
  validRows: number
  rows: InvitationRowPreview[]
}

export interface InvitationBatchResult {
  batchId: string
  sent: number
  rejected: InvitationRowPreview[]
}

export interface Invitation {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: InvitationStatus
  expiresAt: string
  acceptedAt: string | null
  sendCount: number
  lastSentAt: string | null
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  action: string
  entityType: string
  entityId: string | null
  userId: string | null
  userEmail: string | null
  changes: string | null
  ipAddress: string | null
}

export type ItemStatus = 'Active' | 'Archived'

export interface Item {
  id: string
  name: string
  description: string | null
  amount: number
  status: ItemStatus
  createdAt: string
}

export interface ItemInput {
  name: string
  description: string | null
  amount: number
}
