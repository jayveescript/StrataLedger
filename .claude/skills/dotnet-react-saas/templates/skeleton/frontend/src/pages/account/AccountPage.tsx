import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useChangePassword, useUpdateProfile } from '@/api/account'
import { Button, Card, CardBody, CardHeader, CardTitle, Input } from '@/components/atoms'
import { Alert, Dialog, FormField, PageHeader, StatusBadge } from '@/components/molecules'
import { MfaEnrollment, RecoveryCodes, SessionList, SetPasswordFields } from '@/components/organisms'
import { useAuth } from '@/auth/useAuth'
import { applyServerErrors } from '@/lib/apiErrors'
import { passwordSchema } from '@/lib/passwordPolicy'

const passwordForm = z
  .object({ currentPassword: z.string().min(1, 'Required'), password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })

function ChangePasswordCard() {
  const change = useChangePassword()
  const { logout } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<z.infer<typeof passwordForm>>({ resolver: zodResolver(passwordForm) })
  const password = useWatch({ control: form.control, name: 'password' })

  const submit = form.handleSubmit(async (v) => {
    setError(null)
    try {
      await change.mutateAsync({ currentPassword: v.currentPassword, newPassword: v.password })
      await logout() // All sessions are revoked server-side; sign in again with the new password.
    } catch (e) {
      setError(applyServerErrors(e, form.setError, ['currentPassword', 'password']))
    }
  })

  return (
    <Card>
      <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
      <CardBody>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          <FormField label="Current password" error={form.formState.errors.currentPassword?.message}>
            <Input type="password" autoComplete="current-password" {...form.register('currentPassword')} />
          </FormField>
          <SetPasswordFields register={form.register} errors={form.formState.errors} password={password ?? ''} label="New password" />
          <Button type="submit" loading={form.formState.isSubmitting}>Update password</Button>
        </form>
      </CardBody>
    </Card>
  )
}

function ProfileCard() {
  const { me, reloadMe } = useAuth()
  const update = useUpdateProfile()
  const form = useForm({ defaultValues: { firstName: me?.firstName ?? '', lastName: me?.lastName ?? '', phoneNumber: '' } })
  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardBody>
        <form onSubmit={form.handleSubmit((v) => update.mutate({ ...v, phoneNumber: v.phoneNumber || null }, { onSuccess: () => void reloadMe() }))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {update.isSuccess && <Alert tone="success" className="sm:col-span-2">Profile updated.</Alert>}
          <FormField label="First name"><Input {...form.register('firstName', { required: true })} /></FormField>
          <FormField label="Last name"><Input {...form.register('lastName', { required: true })} /></FormField>
          <FormField label="Email" hint="Contact your administrator to change it."><Input value={me?.email ?? ''} disabled /></FormField>
          <FormField label="Phone"><Input type="tel" {...form.register('phoneNumber')} /></FormField>
          <div className="sm:col-span-2"><Button type="submit" loading={update.isPending}>Save profile</Button></div>
        </form>
      </CardBody>
    </Card>
  )
}

function MfaCard() {
  const { me, reloadMe } = useAuth()
  const [enrolling, setEnrolling] = useState(false)
  const [codes, setCodes] = useState<string[] | null>(null)
  return (
    <Card>
      <CardHeader><CardTitle>Two-factor authentication</CardTitle><StatusBadge value={me?.mfaEnabled ? 'Enabled' : 'Disabled'} label={me?.mfaEnabled ? 'Enabled' : 'Not enabled'} /></CardHeader>
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-ink-soft"><ShieldCheck className="h-4 w-4" />
          {me?.mfaEnabled ? 'Your account is protected with an authenticator app.' : 'Add an authenticator app for stronger protection.'}</p>
        {!me?.mfaEnabled && <Button onClick={() => setEnrolling(true)}>Set up</Button>}
      </CardBody>
      <Dialog open={enrolling} onOpenChange={setEnrolling} title="Set up two-factor authentication">
        {codes
          ? <RecoveryCodes codes={codes} doneLabel="Done" onDone={() => { setEnrolling(false); setCodes(null); void reloadMe() }} />
          : <MfaEnrollment mfaToken={null} onEnrolled={(r) => setCodes(r.recoveryCodes)} />}
      </Dialog>
    </Card>
  )
}

export function AccountPage() {
  return (
    <>
      <PageHeader title="Security & profile" description="Manage your details, password, two-factor authentication and signed-in devices." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileCard />
        <MfaCard />
        <div className="lg:col-span-2"><ChangePasswordCard /></div>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Active sessions</CardTitle></CardHeader>
          <SessionList />
        </Card>
      </div>
    </>
  )
}
