import { useState, type FormEvent } from 'react'
import { authApi } from '@/api/auth'
import type { AuthResponse } from '@/api/types'
import { Button, Input } from '@/components/atoms'
import { Alert, FormField, OtpInput } from '@/components/molecules'
import { errorMessage } from '@/lib/apiErrors'

export function MfaVerifyForm({ mfaToken, onResponse, onCancel }: { mfaToken: string; onResponse: (r: AuthResponse) => Promise<void>; onCancel: () => void }) {
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onResponse(await authApi.verifyMfa(mfaToken, code, useRecovery))
    } catch (err) {
      setError(errorMessage(err))
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-ink-soft">
        {useRecovery ? 'Enter one of your saved recovery codes.' : 'Enter the 6-digit code from your authenticator app.'}
      </p>
      {error && <Alert tone="danger">{error}</Alert>}
      <FormField label={useRecovery ? 'Recovery code' : 'Verification code'}>
        {useRecovery
          ? <Input value={code} onChange={(e) => setCode(e.target.value)} autoFocus autoComplete="off" className="font-mono" />
          : <OtpInput value={code} onChange={(e) => setCode(e.target.value)} autoFocus />}
      </FormField>
      <Button type="submit" block loading={busy} disabled={code.trim().length < 6}>Verify</Button>
      <div className="flex justify-between text-sm">
        <button type="button" className="font-medium text-ink-soft hover:text-ink" onClick={() => { setUseRecovery(!useRecovery); setCode('') }}>
          {useRecovery ? 'Use authenticator code' : 'Use a recovery code'}
        </button>
        <button type="button" className="text-ink-muted hover:text-ink" onClick={onCancel}>Back to sign in</button>
      </div>
    </form>
  )
}
