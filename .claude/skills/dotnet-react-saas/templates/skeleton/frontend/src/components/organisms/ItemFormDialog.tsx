import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateItem, useUpdateItem } from '@/api/items'
import type { Item } from '@/api/types'
import { Button, Input, Select, Textarea } from '@/components/atoms'
import { Alert, Dialog, FormField } from '@/components/molecules'
import { applyServerErrors } from '@/lib/apiErrors'

// Reference form organism: zod schema mirrors the server validator, server field errors are mapped back onto inputs.

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(200),
  description: z.string().max(2000).optional(),
  amount: z.coerce.number<string>().min(0, 'Must be zero or more'),
  status: z.enum(['Active', 'Archived']),
})
type Values = z.input<typeof schema>
type Output = z.output<typeof schema>

export function ItemFormDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item?: Item }) {
  const create = useCreateItem()
  const update = useUpdateItem()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values, unknown, Output>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    form.reset({ name: item?.name ?? '', description: item?.description ?? '', amount: String(item?.amount ?? 0), status: item?.status ?? 'Active' })
  }, [open, item, form])

  const submit = form.handleSubmit(async (v) => {
    setError(null)
    const body = { name: v.name, description: v.description || null, amount: v.amount }
    try {
      await (item ? update.mutateAsync({ ...body, id: item.id, status: v.status }) : create.mutateAsync(body))
      onOpenChange(false)
    } catch (e) {
      setError(applyServerErrors(e, form.setError, ['name', 'description', 'amount']))
    }
  })

  const e = form.formState.errors
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={item ? 'Edit item' : 'New item'}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} loading={form.formState.isSubmitting}>Save</Button></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}
        <FormField label="Name" required error={e.name?.message}><Input {...form.register('name')} /></FormField>
        <FormField label="Description" error={e.description?.message}><Textarea {...form.register('description')} /></FormField>
        <FormField label="Amount" error={e.amount?.message}><Input type="number" min={0} step="0.01" {...form.register('amount')} /></FormField>
        {item && <FormField label="Status"><Select options={[{ value: 'Active', label: 'Active' }, { value: 'Archived', label: 'Archived' }]} {...form.register('status')} /></FormField>}
      </form>
    </Dialog>
  )
}
