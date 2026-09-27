import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { refreshAccessToken, setSessionExpiredHandler } from '@/api/http'
import { AuthContext, type AuthContextValue } from './authContextValue'
import { tokenStore } from './tokenStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')
  const [me, setMe] = useState<AuthContextValue['me']>(null)

  const clear = useCallback(() => {
    tokenStore.set(null)
    setMe(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  const loadMe = useCallback(async () => {
    const profile = await authApi.me()
    setMe(profile)
    setStatus('authenticated')
    return profile
  }, [])

  // Silent sign-in on page load using the HttpOnly refresh cookie.
  useEffect(() => {
    setSessionExpiredHandler(clear)
    let cancelled = false
    refreshAccessToken()
      .then(async (token) => {
        if (cancelled) return
        if (token) await loadMe()
        else clear()
      })
      .catch(() => {
        if (!cancelled) clear()
      })
    return () => {
      cancelled = true
    }
  }, [clear, loadMe])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      me,
      completeSignIn: async (accessToken) => {
        tokenStore.set(accessToken)
        return loadMe()
      },
      reloadMe: async () => {
        await loadMe()
      },
      logout: async () => {
        await authApi.logout().catch(() => undefined)
        clear()
      },
    }),
    [status, me, loadMe, clear],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
