import { createContext } from 'react'
import type { Me } from '@/api/types'

type Status = 'loading' | 'anonymous' | 'authenticated'

export interface AuthContextValue {
  status: Status
  me: Me | null
  /** Store a freshly issued access token and load the profile. */
  completeSignIn: (accessToken: string) => Promise<Me>
  reloadMe: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
