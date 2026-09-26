import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import type { AuthResponse } from '@/api/types'
import { homePathFor } from './access'
import { useAuth } from './useAuth'

export type FlowStep =
  | { kind: 'credentials' }
  | { kind: 'mfa'; mfaToken: string }
  | { kind: 'enroll'; mfaToken: string }
  | { kind: 'recovery-codes'; codes: string[]; accessToken: string }

/**
 * Drives the multi-step sign-in (password → MFA or enrollment → recovery codes → app). The step returned by the API
 * selects the next screen through a lookup, not branching in the UI.
 */
export function useSignInFlow(redirectTo?: string) {
  const [step, setStep] = useState<FlowStep>({ kind: 'credentials' })
  const { completeSignIn } = useAuth()
  const navigate = useNavigate()

  const finish = useCallback(
    async (accessToken: string) => {
      const me = await completeSignIn(accessToken)
      navigate(redirectTo ?? homePathFor(me.role), { replace: true })
    },
    [completeSignIn, navigate, redirectTo],
  )

  const handleResponse = useCallback(
    async (response: AuthResponse) => {
      const next: Record<AuthResponse['step'], () => Promise<void> | void> = {
        Completed: () => finish(response.accessToken!),
        MfaRequired: () => setStep({ kind: 'mfa', mfaToken: response.mfaToken! }),
        MfaEnrollmentRequired: () => setStep({ kind: 'enroll', mfaToken: response.mfaToken! }),
      }
      await next[response.step]()
    },
    [finish],
  )

  return {
    step,
    handleResponse,
    showRecoveryCodes: (codes: string[], accessToken: string) => setStep({ kind: 'recovery-codes', codes, accessToken }),
    finish,
    restart: () => setStep({ kind: 'credentials' }),
  }
}
