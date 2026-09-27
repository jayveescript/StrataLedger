import { Navigate, Outlet, useLocation } from 'react-router'
import { Spinner } from '@/components/atoms'
import { FeatureLockNotice } from '@/components/molecules'
import { evaluateAccess, type AccessRule } from '@/auth/access'
import { useAuth } from '@/auth/useAuth'
import { ForbiddenPage } from '@/pages/ErrorPages'

/** Route guard: signed in, allowed by role/permission, and (if required) the tenant's plan includes the feature. */
export function RequireAuth(rule: AccessRule) {
  const { status, me } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <div className="flex h-full items-center justify-center"><Spinner size="lg" className="text-ink-muted" /></div>
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  const views = {
    allowed: <Outlet />,
    forbidden: <ForbiddenPage />,
    locked: <FeatureLockNotice feature={rule.feature} />,
  }
  return views[evaluateAccess(me, rule)]
}

/** Keeps signed-in users away from the login screen. */
export function RedirectIfAuthenticated() {
  const { status } = useAuth()
  if (status === 'loading') return <div className="flex h-full items-center justify-center"><Spinner size="lg" className="text-ink-muted" /></div>
  return status === 'authenticated' ? <Navigate to="/" replace /> : <Outlet />
}
