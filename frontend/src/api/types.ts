// DTOs mirrored from the .NET API. Enums are serialised as strings.

export type UserRole = 'Owner' | 'Accountant' | 'StrataManager' | 'CompanyAdmin' | 'SuperAdmin'
export type SubscriptionTier = 'Starter' | 'Professional' | 'Enterprise'
export type CompanyStatus = 'Active' | 'Suspended' | 'Cancelled'
export type InvitationStatus = 'Pending' | 'Accepted' | 'Revoked' | 'Expired'
export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT'
export type LotType = 'Apartment' | 'Townhouse' | 'Commercial' | 'Carpark' | 'Storage'
export type LotStatus = 'Occupied' | 'Vacant' | 'Tenanted'
export type PlanStatus = 'Active' | 'Onboarding' | 'Archived'
export type PlanHealth = 'Healthy' | 'AtRisk' | 'Critical'
export type PortalAccessStatus = 'None' | 'Invited' | 'Active'
export type SignInStep = 'Completed' | 'MfaRequired' | 'MfaEnrollmentRequired'

export type Permission =
  | 'PlatformCompaniesManage' | 'PlatformTiersManage' | 'PlatformFeaturesManage' | 'PlatformSessionsManage'
  | 'CompanyUsersRead' | 'CompanyUsersManage' | 'CompanyUsersInvite' | 'CompanyBrandingManage' | 'CompanyAuditRead'
  | 'CompanyUsageRead' | 'PlansRead' | 'PlansWrite' | 'LotsRead' | 'LotsWrite' | 'OwnersRead' | 'OwnersWrite'
  | 'OwnersInvite' | 'PortalAccess'

export type Feature =
  | 'StrataPlans' | 'OwnerPortal' | 'OwnerInvitations' | 'CustomBranding' | 'AuditLog' | 'Documents' | 'Levies'
  | 'Expenses' | 'Suppliers' | 'Reports' | 'RulesEngine' | 'Agm' | 'Complaints' | 'CapitalWorks' | 'CommissionRegister'

export const ALL_FEATURES: Feature[] = [
  'StrataPlans', 'OwnerPortal', 'OwnerInvitations', 'CustomBranding', 'AuditLog', 'Documents', 'Levies', 'Expenses',
  'Suppliers', 'Reports', 'RulesEngine', 'Agm', 'Complaints', 'CapitalWorks', 'CommissionRegister',
]
export const AU_STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']
export const LOT_TYPES: LotType[] = ['Apartment', 'Townhouse', 'Commercial', 'Carpark', 'Storage']
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
  company: { id: string; name: string; tier: SubscriptionTier; status: CompanyStatus } | null
  permissions: Permission[]
  features: Feature[]
  branding: Branding
}

export interface InvitationPreview {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  companyName: string
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
  includedOwners: number
  ownerCount: number
  billableOverageOwners: number
  perOwnerOverageCents: number
  monthlyBaseCents: number
  estimatedMonthlyCents: number
}

export interface Usage {
  tier: SubscriptionTier
  tierName: string
  strataPlans: number
  maxStrataPlans: number | null
  storageUsedBytes: number
  storageQuotaBytes: number
  pricing: UsagePricing
}

export interface CompanyListItem {
  id: string
  name: string
  slug: string
  abn: string | null
  tier: SubscriptionTier
  status: CompanyStatus
  states: AustralianState[]
  contactEmail: string
  planCount: number
  userCount: number
  createdAt: string
}

export interface CompanyDetail {
  id: string
  name: string
  slug: string
  abn: string | null
  contactName: string
  contactEmail: string
  phone: string | null
  states: AustralianState[]
  tier: SubscriptionTier
  status: CompanyStatus
  createdAt: string
  branding: Branding
  usage: Usage
}

export interface CompanyInput {
  name: string
  abn: string | null
  contactName: string
  contactEmail: string
  phone: string | null
  states: AustralianState[]
}

export interface Tier {
  tier: SubscriptionTier
  name: string
  features: Feature[]
  maxStrataPlans: number | null
  storageQuotaMb: number
  includedOwners: number
  perOwnerOverageCents: number
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

export interface CompanyUser {
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
  planNumber?: string | null
  lotNumber?: string | null
}

export interface InvitationRowPreview {
  rowNumber: number
  email: string
  firstName: string
  lastName: string
  role: string
  parsedRole: UserRole | null
  planNumber: string | null
  lotNumber: string | null
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
  planName: string | null
  lotNumber: string | null
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

export interface StrataPlanListItem {
  id: string
  name: string
  planNumber: string
  address: string
  state: AustralianState
  status: PlanStatus
  health: PlanHealth
  totalLots: number
  ownerCount: number
  adminFundBalance: number
  capitalWorksFundBalance: number
  nextAgmDate: string | null
}

export interface LotOwner {
  ownerId: string
  name: string
  email: string
  sharePercent: number
  hasPortalAccess: boolean
}

export interface Lot {
  id: string
  strataPlanId: string
  lotNumber: string
  unitNumber: string | null
  floor: number | null
  type: LotType
  status: LotStatus
  entitlementUnits: number
  owners: LotOwner[]
}

export interface StrataPlanDetail {
  id: string
  name: string
  planNumber: string
  address: string
  state: AustralianState
  status: PlanStatus
  health: PlanHealth
  financialYearStart: string
  nextAgmDate: string | null
  adminFundBalance: number
  capitalWorksFundBalance: number
  totalEntitlement: number
  lots: Lot[]
}

export interface OwnerListItem {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  entityName: string | null
  lotCount: number
  portalStatus: PortalAccessStatus
}

export interface OwnerDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  postalAddress: string | null
  entityName: string | null
  portalStatus: PortalAccessStatus
  lots: {
    lotId: string
    lotNumber: string
    unitNumber: string | null
    strataPlanId: string
    planName: string
    planNumber: string
    sharePercent: number
  }[]
}

export interface OwnerInput {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  postalAddress: string | null
  entityName: string | null
}

export interface DashboardSummary {
  strataPlans: number
  lots: number
  owners: number
  ownersWithPortal: number
  pendingInvitations: number
  adminFundTotal: number
  capitalWorksFundTotal: number
  alerts: { id: string; name: string; health: PlanHealth; nextAgmDate: string | null }[]
}

export interface PortalLot {
  lotId: string
  lotNumber: string
  unitNumber: string | null
  type: LotType
  entitlementUnits: number
  sharePercent: number
  strataPlanId: string
  planName: string
  planNumber: string
  address: string
  nextAgmDate: string | null
  adminFundBalance: number
  capitalWorksFundBalance: number
  planTotalEntitlement: number
}

export interface OwnerPortalSummary {
  ownerId: string
  firstName: string
  lastName: string
  email: string
  lots: PortalLot[]
}
