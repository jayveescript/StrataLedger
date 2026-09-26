import { useContext } from 'react'
import { AuthContext } from './authContextValue'
import { evaluateAccess, type AccessRule } from './access'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

/** Access check for a rule against the signed-in user: 'allowed' | 'forbidden' | 'locked'. */
export function useAccess(rule: AccessRule) {
  return evaluateAccess(useAuth().me, rule)
}
