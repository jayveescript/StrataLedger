import { createContext } from 'react'
import type { Branding } from '@/api/types'

export interface BrandContextValue {
  branding: Branding
  /** Temporarily theme the app (e.g. invitation page for a company, or live preview in the branding editor). */
  setOverride: (branding: Branding | null) => void
}

export const BrandContext = createContext<BrandContextValue | null>(null)
