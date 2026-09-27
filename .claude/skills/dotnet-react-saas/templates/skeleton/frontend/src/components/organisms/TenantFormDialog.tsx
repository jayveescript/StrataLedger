import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateTenant, useUpdateTenant } from '@/api/platform'
import { TIERS, type TenantDetail } from '@/api/types'
import { Button, Input, Select } from '@/components/atoms'
import { Alert, Dialog, FormField } from '@/components/molecules'
import { applyServerErrors } from '@/lib/apiErrors'

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(200),
  taxId: z.string().max(30).optional(),
  contactName: z.string().trim().min(1, 'Required').max(200),
  contactEmail: z.email('Enter a valid email'),
  phone: z.string().max(30).optional(),
  tier: z.enum(TIERS),
})
type Values = z.infer<typeof schema>
const FIELDS = ['name', 'taxId', 'contactName', 'contactEmail', 'phone'] as const

/** Super Admin onboarding of a customer tenant (every user, even a sole trader, belongs to one). */
export function TenantFormDialog({ open, onOpenChange, tenant, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; tenant?: TenantDetail; onCreated?: (id: string) => void }) {
  const create = useCreateTenant()
  const update = useUpdateTenant(tenant?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: tenant?.name ?? '', taxId: tenant?.taxId ?? '', contactName: tenant?.contactName ?? '', contactEmail: tenant?.contactEmail ?? '',
      phone: tenant?.phone ?? '', tier: tenant?.tier ?? 'Starter',
    })
  }, [open, tenant, form])

  const submit = form.handleSubmit(async (v) => {
    setError(null)
    const body = { name: v.name, taxId: v.taxId || null, contactName: v.contactName, contactEmail: v.contactEmail, phone: v.phone || null }
    try {
      if (tenant) await update.mutateAsync(body)
      else onCreated?.((await create.mutateAsync({ ...body, tier: v.tier })).id)
      onOpenChange(false)
    } catch (e) {
      setError(applyServerErrors(e, form.setError, FIELDS))
    }
  })

  const e = form.formState.errors
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={tenant ? 'Edit tenant' : 'Onboard a tenant'} size="lg"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} loading={form.formState.isSubmitting}>{tenant ? 'Save' : 'Create tenant'}</Button></>}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        {error && <Alert tone="danger" className="sm:col-span-2">{error}</Alert>}
        <FormField label="Tenant name" required error={e.name?.message}><Input {...form.register('name')} /></FormField>
        <FormField label="Tax / business number" error={e.taxId?.message}><Input {...form.register('taxId')} /></FormField>
        <FormField label="Contact name" required error={e.contactName?.message}><Input {...form.register('contactName')} /></FormField>
        <FormField label="Contact email" required error={e.contactEmail?.message}><Input type="email" {...form.register('contactEmail')} /></FormField>
        <FormField label="Phone"><Input type="tel" {...form.register('phone')} /></FormField>
        {!tenant && <FormField label="Pricing tier"><Select options={TIERS.map((t) => ({ value: t, label: t }))} {...form.register('tier')} /></FormField>}
      </form>
    </Dialog>
  )
}
