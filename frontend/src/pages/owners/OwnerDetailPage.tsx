import { ArrowLeft, Mail, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useDeleteOwner, useInviteOwner, useOwner } from '@/api/strata'
import { Button, Card, CardBody, CardHeader, CardTitle } from '@/components/atoms'
import { Alert, ConfirmDialog, DescriptionList, EmptyState, PageHeader, QueryState, StatusBadge } from '@/components/molecules'
import { DataTable, OwnerFormDialog } from '@/components/organisms'
import { useAccess } from '@/auth/useAuth'
import { errorMessage } from '@/lib/apiErrors'
import { Layers } from 'lucide-react'

export function OwnerDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const query = useOwner(id)
  const invite = useInviteOwner()
  const remove = useDeleteOwner()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const canWrite = useAccess({ permission: 'OwnersWrite' }) === 'allowed'
  const inviteAccess = useAccess({ permission: 'OwnersInvite', feature: 'OwnerPortal' })

  return (
    <QueryState query={query}>
      {(owner) => (
        <>
          <Link to="/owners" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" />All owners</Link>
          <PageHeader
            title={`${owner.firstName} ${owner.lastName}`}
            description={owner.entityName ?? owner.email}
            actions={
              <>
                {inviteAccess === 'allowed' && owner.portalStatus === 'None' && (
                  <Button onClick={() => invite.mutate(owner.id)} loading={invite.isPending}><Mail className="h-4 w-4" />Invite to portal</Button>
                )}
                {canWrite && <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>}
                {canWrite && <Button variant="outline" onClick={() => setDeleting(true)}><Trash2 className="h-4 w-4" />Delete</Button>}
              </>
            }
          />
          {invite.isSuccess && <Alert tone="success" className="mb-4">Invitation emailed to {owner.email}.</Alert>}
          {invite.isError && <Alert tone="danger" className="mb-4">{errorMessage(invite.error)}</Alert>}
          {remove.isError && <Alert tone="danger" className="mb-4">{errorMessage(remove.error)}</Alert>}
          <Card className="mb-6">
            <CardHeader><CardTitle>Contact</CardTitle><StatusBadge value={owner.portalStatus} label={owner.portalStatus === 'None' ? 'No portal access' : `Portal ${owner.portalStatus.toLowerCase()}`} /></CardHeader>
            <CardBody>
              <DescriptionList items={[
                { label: 'Email', value: owner.email },
                { label: 'Phone', value: owner.phone },
                { label: 'Postal address', value: owner.postalAddress },
                { label: 'Entity', value: owner.entityName ?? 'Individual' },
              ]} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Lots owned</CardTitle></CardHeader>
            <DataTable
              rows={owner.lots}
              rowKey={(l) => l.lotId}
              onRowClick={(l) => navigate(`/strata-plans/${l.strataPlanId}`)}
              empty={<EmptyState icon={Layers} title="Not assigned to any lot" description="Assign this owner from a strata plan's lot list." />}
              columns={[
                { key: 'plan', header: 'Plan', cell: (l) => <div><p className="font-medium">{l.planName}</p><p className="text-xs text-ink-muted">{l.planNumber}</p></div> },
                { key: 'lot', header: 'Lot', cell: (l) => `${l.lotNumber}${l.unitNumber ? ` (Unit ${l.unitNumber})` : ''}` },
                { key: 'share', header: 'Share', cell: (l) => `${l.sharePercent}%` },
              ]}
            />
          </Card>
          <OwnerFormDialog open={editing} onOpenChange={setEditing} owner={owner} />
          <ConfirmDialog open={deleting} onOpenChange={setDeleting} destructive title="Delete owner?" confirmLabel="Delete"
            description="Owners must be removed from all lots first. The record is archived for audit purposes." loading={remove.isPending}
            onConfirm={() => void remove.mutateAsync(owner.id).then(() => navigate('/owners')).finally(() => setDeleting(false))} />
        </>
      )}
    </QueryState>
  )
}
