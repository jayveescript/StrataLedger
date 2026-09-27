import type { Me } from '@/api/types'
import { DEFAULT_BRANDING } from '@/brand/brandTokens'

export const makeMe = (overrides: Partial<Me> = {}): Me => ({
  id: 'u1',
  email: 'jo@acme.test',
  firstName: 'Jo',
  lastName: 'Manager',
  role: 'Manager',
  isCommitteeMember: false,
  mfaEnabled: true,
  tenant: { id: 'c1', name: 'Acme Corp', tier: 'Starter', status: 'Active' },
  permissions: ['ItemsRead', 'ItemsWrite', 'MembersInvite', 'TenantUsersRead'],
  features: ['Items', 'MemberPortal', 'MemberInvitations'],
  branding: DEFAULT_BRANDING,
  ...overrides,
})
