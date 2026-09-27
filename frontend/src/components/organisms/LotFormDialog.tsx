import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateLot, useUpdateLot } from '@/api/strata'
import { LOT_TYPES, type Lot } from '@/api/types'
import { Button, Input, Select } from '@/components/atoms'
import { Alert, Dialog, FormField } from '@/components/molecules'
import { applyServerErrors } from '@/lib/apiErrors'

const schema = z.object({
  lotNumber: z.string().trim().min(1, 'Required').max(30),
  unitNumber: z.string().max(30).optional(),
  floor: z.string().optional(),
  type: z.enum(LOT_TYPES),
  status: z.enum(['Occupied', 'Vacant', 'Tenanted']),
  entitlementUnits: z.coerce.number<string>().int().min(0).max(100000),
})
type Values = z.input<typeof schema>
type Output = z.output<typeof schema>

export function LotFormDialog({ open, onOpenChange, planId, lot }: { open: boolean; onOpenChange: (o: boolean) => void; planId: string; lot?: Lot }) {
  const create = useCreateLot(planId)
  const update = useUpdateLot()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values, unknown, Output>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    form.reset({
      lotNumber: lot?.lotNumber ?? '', unitNumber: lot?.unitNumber ?? '', floor: lot?.floor?.toString() ?? '',
      type: lot?.type ?? 'Apartment', status: lot?.status ?? 'Vacant', entitlementUnits: String(lot?.entitlementUnits ?? 10),
    })
  }, [open, lot, form])

  const submit = form.handleSubmit(async (v) => {
    setError(null)
    const body = { lotNumber: v.lotNumber, unitNumber: v.unitNumber || null, floor: v.floor ? Number(v.floor) : null, type: v.type, entitlementUnits: v.entitlementUnits }
    try {
      await (lot ? update.mutateAsync({ ...body, id: lot.id, status: v.status }) : create.mutateAsync(body))
      onOpenChange(false)
    } catch (e) {
      setError(applyServerErrors(e, form.setError, ['lotNumber', 'unitNumber', 'entitlementUnits']))
    }
  })

  const e = form.formState.errors
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={lot ? `Edit ${lot.lotNumber}` : 'Add lot'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} loading={form.formState.isSubmitting}>Save</Button></>}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4" noValidate>
        {error && <Alert tone="danger" className="col-span-2">{error}</Alert>}
        <FormField label="Lot number" required error={e.lotNumber?.message}><Input placeholder="Lot 1" {...form.register('lotNumber')} /></FormField>
        <FormField label="Unit number"><Input {...form.register('unitNumber')} /></FormField>
        <FormField label="Floor"><Input type="number" {...form.register('floor')} /></FormField>
        <FormField label="Entitlement units" required error={e.entitlementUnits?.message}><Input type="number" min={0} {...form.register('entitlementUnits')} /></FormField>
        <FormField label="Type"><Select options={LOT_TYPES.map((t) => ({ value: t, label: t }))} {...form.register('type')} /></FormField>
        {lot && <FormField label="Status"><Select options={['Occupied', 'Vacant', 'Tenanted'].map((s) => ({ value: s, label: s }))} {...form.register('status')} /></FormField>}
      </form>
    </Dialog>
  )
}
