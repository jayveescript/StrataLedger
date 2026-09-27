import type { Feature, Me, Permission, UserRole } from '@/api/types'

/** Declarative access rule used by routes, navigation and buttons alike. */
export interface AccessRule {
  roles?: UserRole[]
  permission?: Permission
  feature?: Feature
}

export type AccessResult = 'allowed' | 'forbidden' | 'locked'

/** "locked" = the role may use it but the company's plan doesn't include the feature (upsell). */
export function evaluateAccess(me: Me | null, rule: AccessRule): AccessResult {
  if (!me) return 'forbidden'
  const roleOk = !rule.roles || rule.roles.includes(me.role)
  const permissionOk = !rule.permission || me.permissions.includes(rule.permission)
  if (!roleOk || !permissionOk) return 'forbidden'
  return !rule.feature || me.features.includes(rule.feature) ? 'allowed' : 'locked'
}

export const homePathFor = (role: UserRole) =>
  ({ SuperAdmin: '/platform/companies', Owner: '/portal' } as Partial<Record<UserRole, string>>)[role] ?? '/dashboard'
