import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import type { AuthResponse } from '@/api/types'
import { Button, Input } from '@/components/atoms'
import { Alert, FormField } from '@/components/molecules'
import { errorMessage } from '@/lib/apiErrors'

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
type Values = z.infer<typeof schema>

export function LoginForm({ onResponse }: { onResponse: (response: AuthResponse) => Promise<void> }) {
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) })

  const submit = handleSubmit(async ({ email, password }) => {
    setError(null)
    try {
      await onResponse(await authApi.login(email, password))
    } catch (e) {
      setError(errorMessage(e))
    }
  })

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <FormField label="Email" error={formState.errors.email?.message}>
        <Input type="email" autoComplete="username" autoFocus {...register('email')} />
      </FormField>
      <FormField label="Password" error={formState.errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...register('password')} />
      </FormField>
      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-sm font-medium text-ink-soft hover:text-ink hover:underline">Forgot password?</Link>
      </div>
      <Button type="submit" block loading={formState.isSubmitting}>Sign in</Button>
    </form>
  )
}
