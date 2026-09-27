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

const staff = ['TenantAdmin', 'Manager', 'Viewer', 'SuperAdmin'] as const

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
            element: <RequireAuth roles={[...staff]} permission="ItemsRead" feature="Items" />,
            children: [{ path: 'items', lazy: page(() => import('@/pages/items/ItemsPage'), 'ItemsPage') }],
          },
          {
            path: 'tenant',
            element: <Outlet />,
            children: [
              { element: <RequireAuth permission="MembersInvite" />, children: [{ path: 'invitations', lazy: page(() => import('@/pages/tenant/InvitationsPage'), 'InvitationsPage') }] },
              { element: <RequireAuth permission="TenantUsersRead" />, children: [{ path: 'users', lazy: page(() => import('@/pages/tenant/UsersPage'), 'UsersPage') }] },
              { element: <RequireAuth permission="TenantBrandingManage" feature="CustomBranding" />, children: [{ path: 'branding', lazy: page(() => import('@/pages/tenant/BrandingPage'), 'BrandingPage') }] },
              { element: <RequireAuth permission="TenantUsageRead" />, children: [{ path: 'usage', lazy: page(() => import('@/pages/tenant/UsagePage'), 'UsagePage') }] },
              { element: <RequireAuth permission="TenantAuditRead" feature="AuditLog" />, children: [{ path: 'audit', lazy: page(() => import('@/pages/tenant/AuditLogPage'), 'AuditLogPage') }] },
            ],
          },
          {
            path: 'platform',
            element: <RequireAuth roles={['SuperAdmin']} />,
            children: [
              { path: 'tenants', lazy: page(() => import('@/pages/platform/TenantsPage'), 'TenantsPage') },
              { path: 'tenants/:id', lazy: page(() => import('@/pages/platform/TenantDetailPage'), 'TenantDetailPage') },
              { path: 'tiers', lazy: page(() => import('@/pages/platform/TiersPage'), 'TiersPage') },
              { path: 'audit', lazy: page(() => import('@/pages/tenant/AuditLogPage'), 'AuditLogPage', 'platform') },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
