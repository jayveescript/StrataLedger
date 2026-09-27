import { Navigate } from 'react-router'
import { homePathFor } from '@/auth/access'
import { useAuth } from '@/auth/useAuth'

export function HomeRedirect() {
  const { me } = useAuth()
  return <Navigate to={me ? homePathFor(me.role) : '/login'} replace />
}
