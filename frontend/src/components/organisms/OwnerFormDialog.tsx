import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateOwner, useUpdateOwner } from '@/api/strata'
import type { OwnerDetail } from '@/api/types'
import { Button, Input } from '@/components/atoms'
import { Alert, Dialog, FormField } from '@/components/molecules'
import { applyServerErrors } from '@/lib/apiErrors'

const schema = z.object({
  firstName: z.string().trim().min(1, 'Required').max(100),
  lastName: z.string().trim().min(1, 'Required').max(100),
  email: z.email('Enter a valid email'),
  phone: z.string().max(30).optional(),
  postalAddress: z.string().max(300).optional(),
  entityName: z.string().max(200).optional(),
})
type Values = z.infer<typeof schema>
const FIELDS = ['firstName', 'lastName', 'email', 'phone', 'postalAddress', 'entityName'] as const

export function OwnerFormDialog({ open, onOpenChange, owner, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; owner?: OwnerDetail; onCreated?: (id: string) => void }) {
  const create = useCreateOwner()
  const update = useUpdateOwner(owner?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    form.reset({
      firstName: owner?.firstName ?? '', lastName: owner?.lastName ?? '', email: owner?.email ?? '',
      phone: owner?.phone ?? '', postalAddress: owner?.postalAddress ?? '', entityName: owner?.entityName ?? '',
    })
  }, [open, owner, form])

  const submit = form.handleSubmit(async (v) => {
    setError(null)
    const body = { ...v, phone: v.phone || null, postalAddress: v.postalAddress || null, entityName: v.entityName || null }
    try {
      if (owner) await update.mutateAsync(body)
      else onCreated?.((await create.mutateAsync(body)).id)
      onOpenChange(false)
    } catch (e) {
      setError(applyServerErrors(e, form.setError, FIELDS))
    }
  })

  const e = form.formState.errors
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={owner ? 'Edit owner' : 'New owner'} size="lg"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} loading={form.formState.isSubmitting}>Save</Button></>}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        {error && <Alert tone="danger" className="sm:col-span-2">{error}</Alert>}
        <FormField label="First name" required error={e.firstName?.message}><Input {...form.register('firstName')} /></FormField>
        <FormField label="Last name" required error={e.lastName?.message}><Input {...form.register('lastName')} /></FormField>
        <FormField label="Email" required error={e.email?.message} hint={owner?.portalStatus === 'Active' ? 'Managed by the owner once portal access is active.' : undefined}>
          <Input type="email" disabled={owner?.portalStatus === 'Active'} {...form.register('email')} />
        </FormField>
        <FormField label="Phone" error={e.phone?.message}><Input type="tel" {...form.register('phone')} /></FormField>
        <FormField label="Postal address" className="sm:col-span-2"><Input {...form.register('postalAddress')} /></FormField>
        <FormField label="Company / trust name" hint="Leave blank for individual owners" className="sm:col-span-2"><Input {...form.register('entityName')} /></FormField>
      </form>
    </Dialog>
  )
}
