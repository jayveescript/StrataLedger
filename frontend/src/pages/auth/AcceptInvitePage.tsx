import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useParams } from 'react-router'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { Button, Input, Skeleton } from '@/components/atoms'
import { Alert, FormField } from '@/components/molecules'
import { MfaEnrollment, RecoveryCodes, SetPasswordFields } from '@/components/organisms'
import { AuthLayout } from '@/components/templates'
import { useSignInFlow } from '@/auth/useSignInFlow'
import { useBrand } from '@/brand/useBrand'
import { applyServerErrors, errorMessage } from '@/lib/apiErrors'
import { humanize } from '@/lib/format'
import { passwordSchema } from '@/lib/passwordPolicy'

const schema = z
  .object({
    firstName: z.string().trim().min(1, 'Required').max(100),
    lastName: z.string().trim().min(1, 'Required').max(100),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
type Values = z.infer<typeof schema>

/** Invitation landing: shows the inviting company's branding, sets the password, then enrolls MFA for staff. */
export function AcceptInvitePage() {
  const { token = '' } = useParams()
  const { setOverride } = useBrand()
  const flow = useSignInFlow()
  const [formError, setFormError] = useState<string | null>(null)
  const invitation = useQuery({ queryKey: ['invitation', token], queryFn: () => authApi.getInvitation(token), retry: false })
  const { register, handleSubmit, control, setError, reset, formState } = useForm<Values>({ resolver: zodResolver(schema) })
  const password = useWatch({ control, name: 'password' })

  useEffect(() => {
    if (!invitation.data) return
    setOverride(invitation.data.branding)
    reset({ firstName: invitation.data.firstName, lastName: invitation.data.lastName, password: '', confirmPassword: '' })
    return () => setOverride(null)
  }, [invitation.data, setOverride, reset])

  const submit = handleSubmit(async (v) => {
    setFormError(null)
    try {
      await flow.handleResponse(await authApi.acceptInvitation(token, v.firstName, v.lastName, v.password))
    } catch (e) {
      setFormError(applyServerErrors(e, setError, ['firstName', 'lastName', 'password']))
    }
  })

  if (invitation.isPending) return <AuthLayout title="Loading invitation…"><Skeleton className="h-40" /></AuthLayout>
  if (invitation.isError) {
    return (
      <AuthLayout title="Invitation unavailable">
        <Alert tone="danger">{errorMessage(invitation.error)}</Alert>
        <p className="mt-4 text-sm text-ink-soft">Ask your administrator to resend the invitation, or <Link className="font-medium underline" to="/login">sign in</Link> if you already have an account.</p>
      </AuthLayout>
    )
  }

  const inv = invitation.data
  const { step } = flow
  if (step.kind === 'enroll') {
    return (
      <AuthLayout title="Secure your account" subtitle="Staff accounts must use two-factor authentication.">
        <MfaEnrollment mfaToken={step.mfaToken} onEnrolled={(r) => r.signIn?.accessToken && flow.showRecoveryCodes(r.recoveryCodes, r.signIn.accessToken)} />
      </AuthLayout>
    )
  }
  if (step.kind === 'recovery-codes') {
    return (
      <AuthLayout title="Recovery codes">
        <RecoveryCodes codes={step.codes} onDone={() => void flow.finish(step.accessToken)} doneLabel="Go to my account" />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={`Join ${inv.companyName}`} subtitle={<>You've been invited as <strong>{humanize(inv.role)}</strong> ({inv.email}).</>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <Alert tone="danger">{formError}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First name" error={formState.errors.firstName?.message}><Input autoComplete="given-name" {...register('firstName')} /></FormField>
          <FormField label="Last name" error={formState.errors.lastName?.message}><Input autoComplete="family-name" {...register('lastName')} /></FormField>
        </div>
        <SetPasswordFields register={register} errors={formState.errors} password={password ?? ''} label="Create a password" />
        {inv.requiresMfa && <Alert tone="info">Next you'll set up an authenticator app — it's required for staff.</Alert>}
        <Button type="submit" block loading={formState.isSubmitting}>Activate account</Button>
      </form>
    </AuthLayout>
  )
}
