import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreatePlan, useUpdatePlan } from '@/api/strata'
import { AU_STATES, type StrataPlanDetail } from '@/api/types'
import { Button, Input, Select } from '@/components/atoms'
import { Alert, Dialog, FormField } from '@/components/molecules'
import { applyServerErrors } from '@/lib/apiErrors'

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(200),
  planNumber: z.string().trim().min(1, 'Required').max(30).regex(/^[A-Za-z0-9\- ]+$/, 'Letters, numbers and dashes only'),
  address: z.string().trim().min(1, 'Required').max(300),
  state: z.enum(AU_STATES),
  financialYearStart: z.string().min(1, 'Required'),
  nextAgmDate: z.string().optional(),
  adminFundBalance: z.coerce.number<string>().min(0),
  capitalWorksFundBalance: z.coerce.number<string>().min(0),
  status: z.enum(['Active', 'Onboarding', 'Archived']),
  health: z.enum(['Healthy', 'AtRisk', 'Critical']),
})
type Values = z.input<typeof schema>
type Output = z.output<typeof schema>

const FIELDS = ['name', 'planNumber', 'address', 'state', 'financialYearStart', 'nextAgmDate'] as const

/** Create or edit a strata plan. Opening balances are only captured on create. */
export function PlanFormDialog({ open, onOpenChange, plan }: { open: boolean; onOpenChange: (o: boolean) => void; plan?: StrataPlanDetail }) {
  const create = useCreatePlan()
  const update = useUpdatePlan(plan?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values, unknown, Output>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: plan?.name ?? '', planNumber: plan?.planNumber ?? '', address: plan?.address ?? '', state: plan?.state ?? 'VIC',
      financialYearStart: plan?.financialYearStart ?? `${new Date().getFullYear()}-07-01`, nextAgmDate: plan?.nextAgmDate ?? '',
      adminFundBalance: String(plan?.adminFundBalance ?? 0), capitalWorksFundBalance: String(plan?.capitalWorksFundBalance ?? 0),
      status: plan?.status ?? 'Active', health: plan?.health ?? 'Healthy',
    })
  }, [open, plan, form])

  const submit = form.handleSubmit(async (v) => {
    setError(null)
    const common = { name: v.name, address: v.address, state: v.state, financialYearStart: v.financialYearStart, nextAgmDate: v.nextAgmDate || null }
    try {
      await (plan
        ? update.mutateAsync({ ...common, status: v.status, health: v.health })
        : create.mutateAsync({ ...common, planNumber: v.planNumber, adminFundBalance: v.adminFundBalance, capitalWorksFundBalance: v.capitalWorksFundBalance }))
      onOpenChange(false)
    } catch (e) {
      setError(applyServerErrors(e, form.setError, FIELDS))
    }
  })

  const e = form.formState.errors
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={plan ? 'Edit strata plan' : 'New strata plan'} size="lg"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} loading={form.formState.isSubmitting}>Save</Button></>}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        {error && <Alert tone="danger" className="sm:col-span-2">{error}</Alert>}
        <FormField label="Name" required error={e.name?.message}><Input {...form.register('name')} /></FormField>
        <FormField label="Plan number" required error={e.planNumber?.message} hint={plan ? 'Plan numbers cannot be changed.' : undefined}>
          <Input disabled={!!plan} {...form.register('planNumber')} />
        </FormField>
        <FormField label="Address" required error={e.address?.message} className="sm:col-span-2"><Input {...form.register('address')} /></FormField>
        <FormField label="State" required><Select options={AU_STATES.map((s) => ({ value: s, label: s }))} {...form.register('state')} /></FormField>
        <FormField label="Financial year start" required error={e.financialYearStart?.message}><Input type="date" {...form.register('financialYearStart')} /></FormField>
        <FormField label="Next AGM"><Input type="date" {...form.register('nextAgmDate')} /></FormField>
        {plan ? (
          <>
            <FormField label="Status"><Select options={['Active', 'Onboarding', 'Archived'].map((s) => ({ value: s, label: s }))} {...form.register('status')} /></FormField>
            <FormField label="Health"><Select options={[{ value: 'Healthy', label: 'Healthy' }, { value: 'AtRisk', label: 'At risk' }, { value: 'Critical', label: 'Critical' }]} {...form.register('health')} /></FormField>
          </>
        ) : (
          <>
            <FormField label="Opening admin fund ($)" error={e.adminFundBalance?.message}><Input type="number" min={0} step="0.01" {...form.register('adminFundBalance')} /></FormField>
            <FormField label="Opening capital works fund ($)" error={e.capitalWorksFundBalance?.message}><Input type="number" min={0} step="0.01" {...form.register('capitalWorksFundBalance')} /></FormField>
          </>
        )}
      </form>
    </Dialog>
  )
}
