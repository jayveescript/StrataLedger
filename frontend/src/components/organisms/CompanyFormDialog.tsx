import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useCreateCompany, useUpdateCompany } from '@/api/platform'
import { AU_STATES, TIERS, type AustralianState, type CompanyDetail } from '@/api/types'
import { Button, Checkbox, Input, Label, Select } from '@/components/atoms'
import { Alert, Dialog, FormField } from '@/components/molecules'
import { applyServerErrors } from '@/lib/apiErrors'

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(200),
  abn: z.string().regex(/^(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})?$/, 'ABN must be 11 digits').optional(),
  contactName: z.string().trim().min(1, 'Required').max(200),
  contactEmail: z.email('Enter a valid email'),
  phone: z.string().max(30).optional(),
  states: z.array(z.enum(AU_STATES)).min(1, 'Select at least one state'),
  tier: z.enum(TIERS),
})
type Values = z.infer<typeof schema>
const FIELDS = ['name', 'abn', 'contactName', 'contactEmail', 'phone', 'states'] as const

/** Super Admin onboarding of a customer company (every user, even a sole trader, belongs to one). */
export function CompanyFormDialog({ open, onOpenChange, company, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; company?: CompanyDetail; onCreated?: (id: string) => void }) {
  const create = useCreateCompany()
  const update = useUpdateCompany(company?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: company?.name ?? '', abn: company?.abn ?? '', contactName: company?.contactName ?? '', contactEmail: company?.contactEmail ?? '',
      phone: company?.phone ?? '', states: company?.states ?? [], tier: company?.tier ?? 'Starter',
    })
  }, [open, company, form])

  const states = useWatch({ control: form.control, name: 'states' }) ?? []
  const toggleState = (s: AustralianState) =>
    form.setValue('states', states.includes(s) ? states.filter((x) => x !== s) : [...states, s], { shouldValidate: true })

  const submit = form.handleSubmit(async (v) => {
    setError(null)
    const body = { name: v.name, abn: v.abn || null, contactName: v.contactName, contactEmail: v.contactEmail, phone: v.phone || null, states: v.states }
    try {
      if (company) await update.mutateAsync(body)
      else onCreated?.((await create.mutateAsync({ ...body, tier: v.tier })).id)
      onOpenChange(false)
    } catch (e) {
      setError(applyServerErrors(e, form.setError, FIELDS))
    }
  })

  const e = form.formState.errors
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={company ? 'Edit company' : 'Onboard a company'} size="lg"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} loading={form.formState.isSubmitting}>{company ? 'Save' : 'Create company'}</Button></>}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        {error && <Alert tone="danger" className="sm:col-span-2">{error}</Alert>}
        <FormField label="Company name" required error={e.name?.message}><Input {...form.register('name')} /></FormField>
        <FormField label="ABN" error={e.abn?.message}><Input placeholder="12 345 678 901" {...form.register('abn')} /></FormField>
        <FormField label="Contact name" required error={e.contactName?.message}><Input {...form.register('contactName')} /></FormField>
        <FormField label="Contact email" required error={e.contactEmail?.message}><Input type="email" {...form.register('contactEmail')} /></FormField>
        <FormField label="Phone"><Input type="tel" {...form.register('phone')} /></FormField>
        {!company && <FormField label="Pricing tier"><Select options={TIERS.map((t) => ({ value: t, label: t }))} {...form.register('tier')} /></FormField>}
        <div className="space-y-2 sm:col-span-2">
          <Label>Operating states</Label>
          <div className="flex flex-wrap gap-3">
            {AU_STATES.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-sm"><Checkbox checked={states.includes(s)} onChange={() => toggleState(s)} />{s}</label>
            ))}
          </div>
          {e.states && <p className="text-xs font-medium text-danger">{e.states.message}</p>}
        </div>
      </form>
    </Dialog>
  )
}
