import {
  Building2, CircleDollarSign, Gauge, Home, Layers, LayoutDashboard, Mail, Palette, ScrollText, Settings, UserCog, Users,
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
      { to: '/platform/companies', label: 'Companies', icon: Building2, permission: 'PlatformCompaniesManage' },
      { to: '/platform/tiers', label: 'Pricing tiers', icon: Layers, permission: 'PlatformTiersManage' },
    ],
  },
  {
    title: 'Manage',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'PlansRead', feature: 'StrataPlans', roles: ['CompanyAdmin', 'StrataManager', 'Accountant'] },
      { to: '/strata-plans', label: 'Strata plans', icon: Building2, permission: 'PlansRead', feature: 'StrataPlans', roles: ['CompanyAdmin', 'StrataManager', 'Accountant'] },
      { to: '/owners', label: 'Owners', icon: Users, permission: 'OwnersRead', feature: 'StrataPlans', roles: ['CompanyAdmin', 'StrataManager', 'Accountant'] },
    ],
  },
  {
    title: 'Company',
    items: [
      { to: '/company/invitations', label: 'Invitations', icon: Mail, permission: 'OwnersInvite', roles: ['CompanyAdmin', 'StrataManager'] },
      { to: '/company/users', label: 'Users & roles', icon: UserCog, permission: 'CompanyUsersRead', roles: ['CompanyAdmin', 'StrataManager'] },
      { to: '/company/branding', label: 'Branding', icon: Palette, permission: 'CompanyBrandingManage', feature: 'CustomBranding', roles: ['CompanyAdmin'] },
      { to: '/company/usage', label: 'Plan & usage', icon: CircleDollarSign, permission: 'CompanyUsageRead', roles: ['CompanyAdmin'] },
      { to: '/company/audit', label: 'Audit log', icon: ScrollText, permission: 'CompanyAuditRead', feature: 'AuditLog', roles: ['CompanyAdmin', 'Accountant'] },
    ],
  },
  {
    title: 'Owner portal',
    items: [{ to: '/portal', label: 'My property', icon: Home, permission: 'PortalAccess', feature: 'OwnerPortal', roles: ['Owner'] }],
  },
  {
    title: 'Account',
    items: [
      { to: '/account', label: 'Security & profile', icon: Settings },
      { to: '/platform/audit', label: 'Platform audit', icon: Gauge, roles: ['SuperAdmin'] },
    ],
  },
]
