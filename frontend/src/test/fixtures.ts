import type { Me } from '@/api/types'
import { DEFAULT_BRANDING } from '@/brand/brandTokens'

export const makeMe = (overrides: Partial<Me> = {}): Me => ({
  id: 'u1',
  email: 'jo@acme.test',
  firstName: 'Jo',
  lastName: 'Manager',
  role: 'StrataManager',
  isCommitteeMember: false,
  mfaEnabled: true,
  company: { id: 'c1', name: 'Acme Strata', tier: 'Starter', status: 'Active' },
  permissions: ['PlansRead', 'PlansWrite', 'LotsRead', 'LotsWrite', 'OwnersRead', 'OwnersWrite', 'OwnersInvite', 'CompanyUsersRead'],
  features: ['StrataPlans', 'OwnerPortal', 'OwnerInvitations'],
  branding: DEFAULT_BRANDING,
  ...overrides,
})
