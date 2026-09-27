import { ArrowLeft, Layers, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useDeleteLot, useDeletePlan, usePlan, useRemoveLotOwner, type Lot } from '@/api/strata'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from '@/components/atoms'
import { ConfirmDialog, DescriptionList, EmptyState, PageHeader, QueryState, StatCard, StatusBadge } from '@/components/molecules'
import { AssignOwnerDialog, DataTable, LotFormDialog, PlanFormDialog } from '@/components/organisms'
import { useAccess } from '@/auth/useAuth'
import { formatCurrency, formatDate } from '@/lib/format'
import { CircleDollarSign, PiggyBank } from 'lucide-react'

export function PlanDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const query = usePlan(id)
  const canWritePlan = useAccess({ permission: 'PlansWrite' }) === 'allowed'
  const canWriteLots = useAccess({ permission: 'LotsWrite' }) === 'allowed'
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [lotDialog, setLotDialog] = useState<{ open: boolean; lot?: Lot }>({ open: false })
  const [assignTo, setAssignTo] = useState<Lot | null>(null)
  const [lotToDelete, setLotToDelete] = useState<Lot | null>(null)
  const deletePlan = useDeletePlan()
  const deleteLot = useDeleteLot()
  const removeOwner = useRemoveLotOwner()

  return (
    <QueryState query={query}>
      {(plan) => (
        <>
          <Link to="/strata-plans" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" />All plans</Link>
          <PageHeader
            title={plan.name}
            description={`${plan.planNumber} · ${plan.address}`}
            actions={canWritePlan && (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>
                <Button variant="outline" onClick={() => setDeleting(true)}><Trash2 className="h-4 w-4" />Archive</Button>
              </>
            )}
          />
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label="Admin fund" value={formatCurrency(plan.adminFundBalance)} icon={CircleDollarSign} />
            <StatCard label="Capital works fund" value={formatCurrency(plan.capitalWorksFundBalance)} icon={PiggyBank} />
            <StatCard label="Lots" value={plan.lots.length} icon={Layers} hint={`${plan.totalEntitlement} total entitlement units`} />
          </div>
          <Card className="mb-6">
            <CardHeader><CardTitle>Details</CardTitle><div className="flex gap-2"><StatusBadge value={plan.status} /><StatusBadge value={plan.health} /></div></CardHeader>
            <CardBody>
              <DescriptionList items={[
                { label: 'State', value: plan.state },
                { label: 'Financial year starts', value: formatDate(plan.financialYearStart) },
                { label: 'Next AGM', value: formatDate(plan.nextAgmDate) },
                { label: 'Plan number', value: plan.planNumber },
              ]} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lots & ownership</CardTitle>
              {canWriteLots && <Button size="sm" onClick={() => setLotDialog({ open: true })}><Plus className="h-4 w-4" />Add lot</Button>}
            </CardHeader>
            <DataTable
              rows={plan.lots}
              rowKey={(l) => l.id}
              empty={<EmptyState icon={Layers} title="No lots yet" description="Add the lots on this plan, then assign owners." />}
              columns={[
                { key: 'lot', header: 'Lot', cell: (l) => <div><p className="font-medium">{l.lotNumber}</p><p className="text-xs text-ink-muted">Unit {l.unitNumber ?? '—'} · Floor {l.floor ?? '—'}</p></div> },
                { key: 'type', header: 'Type', cell: (l) => l.type },
                { key: 'uoe', header: 'UOE', cell: (l) => l.entitlementUnits },
                { key: 'status', header: 'Status', cell: (l) => <StatusBadge value={l.status} /> },
                {
                  key: 'owners', header: 'Owners',
                  cell: (l) => (
                    <div className="flex flex-wrap gap-1">
                      {l.owners.length === 0 && <span className="text-ink-muted">—</span>}
                      {l.owners.map((o) => (
                        <Badge key={o.ownerId} tone={o.hasPortalAccess ? 'success' : 'neutral'}>
                          <Link to={`/owners/${o.ownerId}`} className="hover:underline">{o.name}</Link>
                          {o.sharePercent < 100 && ` ${o.sharePercent}%`}
                          {canWriteLots && (
                            <button type="button" aria-label={`Remove ${o.name}`} onClick={() => removeOwner.mutate({ lotId: l.id, ownerId: o.ownerId })}><X className="h-3 w-3" /></button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'actions', header: '', className: 'text-right',
                  cell: (l) => canWriteLots && (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label="Assign owner" onClick={() => setAssignTo(l)}><UserPlus className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Edit lot" onClick={() => setLotDialog({ open: true, lot: l })}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete lot" onClick={() => setLotToDelete(l)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ),
                },
              ]}
            />
          </Card>

          <PlanFormDialog open={editing} onOpenChange={setEditing} plan={plan} />
          <LotFormDialog open={lotDialog.open} onOpenChange={(open) => setLotDialog({ open })} planId={plan.id} lot={lotDialog.lot} />
          <AssignOwnerDialog lot={assignTo} onOpenChange={(o) => !o && setAssignTo(null)} />
          <ConfirmDialog open={deleting} onOpenChange={setDeleting} destructive title="Archive this plan?" confirmLabel="Archive"
            description="The plan is hidden from lists but its history is retained for compliance." loading={deletePlan.isPending}
            onConfirm={() => void deletePlan.mutateAsync(plan.id).then(() => navigate('/strata-plans'))} />
          <ConfirmDialog open={!!lotToDelete} onOpenChange={(o) => !o && setLotToDelete(null)} destructive title={`Remove ${lotToDelete?.lotNumber}?`} confirmLabel="Remove"
            description="The lot and its ownership links are archived." loading={deleteLot.isPending}
            onConfirm={() => lotToDelete && void deleteLot.mutateAsync(lotToDelete.id).then(() => setLotToDelete(null))} />
        </>
      )}
    </QueryState>
  )
}
