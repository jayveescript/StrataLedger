import type { ComponentType } from 'react'
import { createBrowserRouter, Outlet } from 'react-router'
import { AppLayout } from '@/components/templates'
import { LoginPage } from '@/pages/auth/LoginPage'
import { NotFoundPage } from '@/pages/ErrorPages'
import { HomeRedirect } from '@/pages/HomeRedirect'
import { RedirectIfAuthenticated, RequireAuth } from './RequireAuth'

/** Route-level code splitting: each page is its own chunk, loaded on first navigation. */
function page<T extends Record<string, unknown>>(loader: () => Promise<T>, name: keyof T & string, prop?: string) {
  return async () => {
    const Component = (await loader())[name] as ComponentType<Record<string, boolean>>
    return { Component: prop ? () => <Component {...{ [prop]: true }} /> : Component }
  }
}

const staff = ['CompanyAdmin', 'StrataManager', 'Accountant', 'SuperAdmin'] as const

/** Every protected route declares its access rule once; the guard enforces role, permission and plan feature. */
export const router = createBrowserRouter([
  {
    element: <RedirectIfAuthenticated />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', lazy: page(() => import('@/pages/auth/PasswordPages'), 'ForgotPasswordPage') },
    ],
  },
  { path: '/invite/:token', lazy: page(() => import('@/pages/auth/AcceptInvitePage'), 'AcceptInvitePage') },
  { path: '/reset-password', lazy: page(() => import('@/pages/auth/PasswordPages'), 'ResetPasswordPage') },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: 'account', lazy: page(() => import('@/pages/account/AccountPage'), 'AccountPage') },
          {
            element: <RequireAuth roles={[...staff]} permission="PlansRead" feature="StrataPlans" />,
            children: [
              { path: 'dashboard', lazy: page(() => import('@/pages/dashboard/DashboardPage'), 'DashboardPage') },
              { path: 'strata-plans', lazy: page(() => import('@/pages/plans/PlansPage'), 'PlansPage') },
              { path: 'strata-plans/:id', lazy: page(() => import('@/pages/plans/PlanDetailPage'), 'PlanDetailPage') },
            ],
          },
          {
            element: <RequireAuth roles={[...staff]} permission="OwnersRead" feature="StrataPlans" />,
            children: [
              { path: 'owners', lazy: page(() => import('@/pages/owners/OwnersPage'), 'OwnersPage') },
              { path: 'owners/:id', lazy: page(() => import('@/pages/owners/OwnerDetailPage'), 'OwnerDetailPage') },
            ],
          },
          {
            path: 'company',
            element: <Outlet />,
            children: [
              { element: <RequireAuth permission="OwnersInvite" />, children: [{ path: 'invitations', lazy: page(() => import('@/pages/company/InvitationsPage'), 'InvitationsPage') }] },
              { element: <RequireAuth permission="CompanyUsersRead" />, children: [{ path: 'users', lazy: page(() => import('@/pages/company/UsersPage'), 'UsersPage') }] },
              { element: <RequireAuth permission="CompanyBrandingManage" feature="CustomBranding" />, children: [{ path: 'branding', lazy: page(() => import('@/pages/company/BrandingPage'), 'BrandingPage') }] },
              { element: <RequireAuth permission="CompanyUsageRead" />, children: [{ path: 'usage', lazy: page(() => import('@/pages/company/UsagePage'), 'UsagePage') }] },
              { element: <RequireAuth permission="CompanyAuditRead" feature="AuditLog" />, children: [{ path: 'audit', lazy: page(() => import('@/pages/company/AuditLogPage'), 'AuditLogPage') }] },
            ],
          },
          {
            path: 'platform',
            element: <RequireAuth roles={['SuperAdmin']} />,
            children: [
              { path: 'companies', lazy: page(() => import('@/pages/platform/CompaniesPage'), 'CompaniesPage') },
              { path: 'companies/:id', lazy: page(() => import('@/pages/platform/CompanyDetailPage'), 'CompanyDetailPage') },
              { path: 'tiers', lazy: page(() => import('@/pages/platform/TiersPage'), 'TiersPage') },
              { path: 'audit', lazy: page(() => import('@/pages/company/AuditLogPage'), 'AuditLogPage', 'platform') },
            ],
          },
          {
            element: <RequireAuth roles={['Owner']} permission="PortalAccess" feature="OwnerPortal" />,
            children: [{ path: 'portal', lazy: page(() => import('@/pages/portal/PortalHomePage'), 'PortalHomePage') }],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
