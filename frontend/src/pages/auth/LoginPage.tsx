import { useLocation } from 'react-router'
import { LoginForm, MfaEnrollment, MfaVerifyForm, RecoveryCodes } from '@/components/organisms'
import { AuthLayout } from '@/components/templates'
import { useSignInFlow, type FlowStep } from '@/auth/useSignInFlow'

const TITLES: Record<FlowStep['kind'], { title: string; subtitle: string }> = {
  credentials: { title: 'Sign in', subtitle: 'Welcome back. Enter your details to continue.' },
  mfa: { title: 'Two-factor verification', subtitle: 'One more step to confirm it’s you.' },
  enroll: { title: 'Set up two-factor authentication', subtitle: 'Required for staff accounts to protect financial data.' },
  'recovery-codes': { title: 'Recovery codes', subtitle: 'Keep these safe — you will need them if you lose your device.' },
}

export function LoginPage() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const flow = useSignInFlow(from)
  const { step } = flow

  return (
    <AuthLayout {...TITLES[step.kind]}>
      {step.kind === 'credentials' && <LoginForm onResponse={flow.handleResponse} />}
      {step.kind === 'mfa' && <MfaVerifyForm mfaToken={step.mfaToken} onResponse={flow.handleResponse} onCancel={flow.restart} />}
      {step.kind === 'enroll' && (
        <MfaEnrollment
          mfaToken={step.mfaToken}
          onEnrolled={(r) => r.signIn?.accessToken && flow.showRecoveryCodes(r.recoveryCodes, r.signIn.accessToken)}
        />
      )}
      {step.kind === 'recovery-codes' && <RecoveryCodes codes={step.codes} onDone={() => void flow.finish(step.accessToken)} />}
    </AuthLayout>
  )
}
