import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { Button, Input } from '@/components/atoms'
import { Alert, FormField } from '@/components/molecules'
import { SetPasswordFields } from '@/components/organisms'
import { AuthLayout } from '@/components/templates'
import { applyServerErrors } from '@/lib/apiErrors'
import { passwordSchema } from '@/lib/passwordPolicy'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState } = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.email('Enter a valid email') })) })

  const submit = handleSubmit(async ({ email }) => {
    await authApi.forgotPassword(email).catch(() => undefined)
    setSent(true) // Same outcome either way: the API never reveals whether an account exists.
  })

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a secure link that expires in one hour.">
      {sent ? (
        <Alert tone="success" title="Check your inbox">If an account exists for that address, a reset link is on its way.</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField label="Email" error={formState.errors.email?.message}><Input type="email" autoComplete="username" {...register('email')} /></FormField>
          <Button type="submit" block loading={formState.isSubmitting}>Send reset link</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="font-medium text-ink-soft hover:underline">Back to sign in</Link></p>
    </AuthLayout>
  )
}

const resetSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) })
  const password = useWatch({ control: form.control, name: 'password' })
  const email = params.get('email') ?? ''
  const token = params.get('token') ?? ''

  const submit = form.handleSubmit(async ({ password }) => {
    setError(null)
    try {
      await authApi.resetPassword(email, token, password)
      navigate('/login', { replace: true })
    } catch (e) {
      setError(applyServerErrors(e, form.setError, ['password']))
    }
  })

  return (
    <AuthLayout title="Choose a new password" subtitle={email}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}
        <SetPasswordFields register={form.register} errors={form.formState.errors} password={password ?? ''} label="New password" />
        <Button type="submit" block loading={form.formState.isSubmitting}>Update password</Button>
      </form>
    </AuthLayout>
  )
}
