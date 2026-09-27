import { ScrollText } from 'lucide-react'
import { useState } from 'react'
import { useAuditLogs } from '@/api/tenant'
import { Card, Select } from '@/components/atoms'
import { EmptyState, PageHeader, Pagination, QueryState } from '@/components/molecules'
import { DataTable } from '@/components/organisms'
import { formatDateTime, humanize } from '@/lib/format'

const ACTIONS = ['Created', 'Updated', 'Deleted', 'LoginSucceeded', 'LoginFailed', 'LockedOut', 'MfaEnabled', 'MfaFailed', 'Logout',
  'SessionRevoked', 'PasswordChanged', 'PasswordReset', 'InvitationSent', 'InvitationAccepted', 'ForcedLogout']

function summarize(changes: string | null) {
  if (!changes) return '—'
  try {
    const parsed = JSON.parse(changes) as { properties?: Record<string, unknown>; detail?: string; complex?: string[] }
    if (parsed.detail) return parsed.detail
    const keys = [...Object.keys(parsed.properties ?? {}), ...(parsed.complex ?? [])]
    return keys.length ? keys.slice(0, 6).map(humanize).join(', ') + (keys.length > 6 ? '…' : '') : '—'
  } catch {
    return '—'
  }
}

export function AuditLogPanel({ tenantId }: { tenantId?: string }) {
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const query = useAuditLogs({ tenantId, action: action || undefined, page })

  return (
    <Card>
      <div className="border-b border-line p-4">
        <div className="w-56"><Select aria-label="Action" placeholder="All actions" value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} options={ACTIONS.map((a) => ({ value: a, label: humanize(a) }))} /></div>
      </div>
      <QueryState query={query}>
        {(data) => (
          <>
            <DataTable
              rows={data.items}
              rowKey={(l) => l.id}
              empty={<EmptyState icon={ScrollText} title="No audit events" />}
              columns={[
                { key: 'when', header: 'When', cell: (l) => formatDateTime(l.timestamp), className: 'whitespace-nowrap' },
                { key: 'who', header: 'User', cell: (l) => l.userEmail ?? <span className="text-ink-muted">system</span> },
                { key: 'action', header: 'Action', cell: (l) => humanize(l.action) },
                { key: 'entity', header: 'Record', cell: (l) => humanize(l.entityType) },
                { key: 'changes', header: 'Changes', cell: (l) => <span className="text-xs text-ink-soft">{summarize(l.changes)}</span> },
                { key: 'ip', header: 'IP', cell: (l) => l.ipAddress ?? '—' },
              ]}
            />
            <Pagination page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onPageChange={setPage} />
          </>
        )}
      </QueryState>
    </Card>
  )
}

export function AuditLogPage({ platform = false }: { platform?: boolean }) {
  return (
    <>
      <PageHeader title={platform ? 'Platform audit' : 'Audit log'} description="Every change and security event, with who, what, when and where." />
      <AuditLogPanel />
    </>
  )
}
