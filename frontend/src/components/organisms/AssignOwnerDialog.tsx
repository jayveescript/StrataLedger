import { useState } from 'react'
import { useAssignLotOwner, useOwners } from '@/api/strata'
import type { Lot } from '@/api/types'
import { Button, Input, Select } from '@/components/atoms'
import { Alert, Dialog, FormField } from '@/components/molecules'
import { errorMessage } from '@/lib/apiErrors'

export function AssignOwnerDialog({ lot, onOpenChange }: { lot: Lot | null; onOpenChange: (o: boolean) => void }) {
  const owners = useOwners({ pageSize: 100 })
  const assign = useAssignLotOwner()
  const [ownerId, setOwnerId] = useState('')
  const remaining = 100 - (lot?.owners.reduce((sum, o) => sum + o.sharePercent, 0) ?? 0)
  const [share, setShare] = useState('')

  const submit = async () => {
    if (!lot) return
    await assign.mutateAsync({ lotId: lot.id, ownerId, sharePercent: Number(share || remaining) })
    setOwnerId('')
    setShare('')
    onOpenChange(false)
  }

  const assigned = new Set(lot?.owners.map((o) => o.ownerId))
  const options = (owners.data?.items ?? []).filter((o) => !assigned.has(o.id)).map((o) => ({ value: o.id, label: `${o.firstName} ${o.lastName} · ${o.email}` }))

  return (
    <Dialog open={!!lot} onOpenChange={onOpenChange} title={`Assign owner to ${lot?.lotNumber ?? ''}`}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => void submit()} loading={assign.isPending} disabled={!ownerId || remaining <= 0}>Assign</Button></>}>
      <div className="space-y-4">
        {assign.isError && <Alert tone="danger">{errorMessage(assign.error)}</Alert>}
        {remaining <= 0 && <Alert tone="warning">This lot is already 100% owned.</Alert>}
        <FormField label="Owner"><Select placeholder="Select an owner…" options={options} value={ownerId} onChange={(e) => setOwnerId(e.target.value)} /></FormField>
        <FormField label="Ownership share (%)" hint={`Up to ${remaining}% available`}>
          <Input type="number" min={1} max={remaining} placeholder={String(remaining)} value={share} onChange={(e) => setShare(e.target.value)} />
        </FormField>
      </div>
    </Dialog>
  )
}
