import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Branding } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { BrandContext } from './brandContextValue'
import { applyBranding, DEFAULT_BRANDING } from './brandTokens'


/** Resolves the active brand (override > signed-in company > default) and pushes it into CSS variables. */
export function BrandProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth()
  const [override, setOverride] = useState<Branding | null>(null)
  const branding = override ?? me?.branding ?? DEFAULT_BRANDING

  useEffect(() => applyBranding(branding), [branding])

  const value = useMemo(() => ({ branding, setOverride }), [branding])
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}
