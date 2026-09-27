import {
  Boxes, Building2, CircleDollarSign, Gauge, Layers, Mail, Palette, ScrollText, Settings, UserCog,
  type LucideIcon,
} from 'lucide-react'
import type { AccessRule } from '@/auth/access'

export interface NavItem extends AccessRule {
  to: string
  label: string
  icon: LucideIcon
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * The whole menu is data. Items the user's role can't use are hidden; items their plan doesn't include show a lock
 * (upsell) instead of disappearing.
 */
export const NAVIGATION: NavSection[] = [
  {
    title: 'Platform',
    items: [
      { to: '/platform/tenants', label: 'Tenants', icon: Building2, permission: 'PlatformTenantsManage' },
      { to: '/platform/tiers', label: 'Pricing tiers', icon: Layers, permission: 'PlatformTiersManage' },
    ],
  },
  {
    title: 'Manage',
    items: [
      { to: '/items', label: 'Items', icon: Boxes, permission: 'ItemsRead', feature: 'Items', roles: ['TenantAdmin', 'Manager', 'Viewer'] },
    ],
  },
  {
    title: 'Tenant',
    items: [
      { to: '/tenant/invitations', label: 'Invitations', icon: Mail, permission: 'MembersInvite', roles: ['TenantAdmin', 'Manager'] },
      { to: '/tenant/users', label: 'Users & roles', icon: UserCog, permission: 'TenantUsersRead', roles: ['TenantAdmin', 'Manager'] },
      { to: '/tenant/branding', label: 'Branding', icon: Palette, permission: 'TenantBrandingManage', feature: 'CustomBranding', roles: ['TenantAdmin'] },
      { to: '/tenant/usage', label: 'Plan & usage', icon: CircleDollarSign, permission: 'TenantUsageRead', roles: ['TenantAdmin'] },
      { to: '/tenant/audit', label: 'Audit log', icon: ScrollText, permission: 'TenantAuditRead', feature: 'AuditLog', roles: ['TenantAdmin', 'Viewer'] },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/account', label: 'Security & profile', icon: Settings },
      { to: '/platform/audit', label: 'Platform audit', icon: Gauge, roles: ['SuperAdmin'] },
    ],
  },
]
