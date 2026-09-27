import { Mail, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import { useInvitations, useResendInvitation, useRevokeInvitation } from '@/api/tenant'
import type { InvitationStatus } from '@/api/types'
import { Button, Card, CardHeader, CardTitle, Select } from '@/components/atoms'
import { Alert, EmptyState, PageHeader, Pagination, QueryState, StatusBadge } from '@/components/molecules'
import { DataTable, InviteUploadWizard } from '@/components/organisms'
import { errorMessage } from '@/lib/apiErrors'
import { formatDateTime, humanize } from '@/lib/format'

/** Tenant Admin / Manager view. Super Admin reaches the same components through the tenant detail page. */
export function InvitationsPanel({ tenantId }: { tenantId?: string }) {
  const [status, setStatus] = useState<InvitationStatus | ''>('')
  const [page, setPage] = useState(1)
  const query = useInvitations({ tenantId, status: status || undefined, page })
  const resend = useResendInvitation()
  const revoke = useRevokeInvitation()
  const actionError = resend.error ?? revoke.error

  return (
    <div className="space-y-6">
      <InviteUploadWizard tenantId={tenantId} />
      <Card>
        <CardHeader>
          <CardTitle>Sent invitations</CardTitle>
          <div className="w-44">
            <Select aria-label="Status" placeholder="All statuses" value={status} onChange={(e) => { setStatus(e.target.value as InvitationStatus | ''); setPage(1) }}
              options={['Pending', 'Accepted', 'Expired', 'Revoked'].map((s) => ({ value: s, label: s }))} />
          </div>
        </CardHeader>
        {actionError && <Alert tone="danger" className="m-4">{errorMessage(actionError)}</Alert>}
        <QueryState query={query}>
          {(data) => (
            <>
              <DataTable
                rows={data.items}
                rowKey={(i) => i.id}
                empty={<EmptyState icon={Mail} title="No invitations yet" description="Upload an email list above to invite your team and members." />}
                columns={[
                  { key: 'who', header: 'Invitee', cell: (i) => <div><p className="font-medium">{i.firstName} {i.lastName}</p><p className="text-xs text-ink-muted">{i.email}</p></div> },
                  { key: 'role', header: 'Role', cell: (i) => humanize(i.role) },
                  { key: 'status', header: 'Status', cell: (i) => <StatusBadge value={i.status} /> },
                  { key: 'sent', header: 'Last sent', cell: (i) => `${formatDateTime(i.lastSentAt)} (${i.sendCount}×)` },
                  { key: 'expires', header: 'Expires', cell: (i) => formatDateTime(i.expiresAt) },
                  {
                    key: 'actions', header: '', className: 'text-right',
                    cell: (i) => (i.status === 'Pending' || i.status === 'Expired') && (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label="Resend" onClick={() => resend.mutate(i.id)}><RefreshCw className="h-4 w-4" /></Button>
                        {i.status === 'Pending' && <Button size="icon" variant="ghost" aria-label="Revoke" onClick={() => revoke.mutate(i.id)}><X className="h-4 w-4" /></Button>}
                      </div>
                    ),
                  },
                ]}
              />
              <Pagination page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onPageChange={setPage} />
            </>
          )}
        </QueryState>
      </Card>
    </div>
  )
}

export function InvitationsPage() {
  return (
    <>
      <PageHeader title="Invitations" description="Upload an email list — everyone receives a branded link to set up their account." />
      <InvitationsPanel />
    </>
  )
}
