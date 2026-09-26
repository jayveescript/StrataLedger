import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { useState, type FormEvent } from 'react'
import { authApi } from '@/api/auth'
import type { MfaConfirmResponse } from '@/api/types'
import { Button, Skeleton } from '@/components/atoms'
import { Alert, FormField, OtpInput } from '@/components/molecules'
import { errorMessage } from '@/lib/apiErrors'

/** Authenticator enrollment: scan QR (or type key) then confirm a code. Used mid-login (mfaToken) or from Account. */
export function MfaEnrollment({ mfaToken, onEnrolled }: { mfaToken: string | null; onEnrolled: (result: MfaConfirmResponse) => void }) {
  const setup = useQuery({ queryKey: ['mfa-setup', mfaToken], queryFn: () => authApi.beginMfaSetup(mfaToken), staleTime: Infinity, retry: false })
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onEnrolled(await authApi.confirmMfaSetup(mfaToken, code))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (setup.isError) return <Alert tone="danger" title="Could not start setup">{errorMessage(setup.error)}</Alert>

  return (
    <form onSubmit={submit} className="space-y-5">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-soft">
        <li>Install an authenticator app (Microsoft Authenticator, Google Authenticator, 1Password…).</li>
        <li>Scan the QR code, or enter the setup key manually.</li>
        <li>Enter the 6-digit code the app shows.</li>
      </ol>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white p-4">
        {setup.data ? <QRCodeSVG value={setup.data.authenticatorUri} size={176} /> : <Skeleton className="h-44 w-44" />}
        {setup.data && <code className="select-all break-all text-center font-mono text-xs text-ink-soft">{setup.data.sharedKey}</code>}
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <FormField label="Verification code">
        <OtpInput value={code} onChange={(e) => setCode(e.target.value)} />
      </FormField>
      <Button type="submit" block loading={busy} disabled={!setup.data || code.replace(/\s/g, '').length < 6}>Enable two-factor authentication</Button>
    </form>
  )
}
