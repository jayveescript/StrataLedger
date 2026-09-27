import { MonitorSmartphone } from 'lucide-react'
import { useRevokeSession, useSessions } from '@/api/account'
import { Button } from '@/components/atoms'
import { QueryState } from '@/components/molecules'
import { formatDateTime } from '@/lib/format'
import { DataTable } from './DataTable'

const describeAgent = (ua: string | null) => {
  if (!ua) return 'Unknown device'
  const browser = [['Edg', 'Edge'], ['Chrome', 'Chrome'], ['Firefox', 'Firefox'], ['Safari', 'Safari']].find(([k]) => ua.includes(k!))?.[1] ?? 'Browser'
  const os = [['Windows', 'Windows'], ['Mac OS', 'macOS'], ['iPhone', 'iOS'], ['Android', 'Android'], ['Linux', 'Linux']].find(([k]) => ua.includes(k!))?.[1] ?? ''
  return `${browser}${os ? ` on ${os}` : ''}`
}

export function SessionList() {
  const sessions = useSessions()
  const revoke = useRevokeSession()
  return (
    <QueryState query={sessions}>
      {(rows) => (
        <DataTable
          rows={rows}
          rowKey={(s) => s.id}
          columns={[
            { key: 'device', header: 'Device', cell: (s) => <span className="flex items-center gap-2"><MonitorSmartphone className="h-4 w-4 text-ink-muted" />{describeAgent(s.userAgent)}</span> },
            { key: 'ip', header: 'IP address', cell: (s) => s.ipAddress ?? '—' },
            { key: 'signed', header: 'Signed in', cell: (s) => formatDateTime(s.createdAt) },
            { key: 'last', header: 'Last active', cell: (s) => formatDateTime(s.lastUsedAt) },
            { key: 'actions', header: '', className: 'text-right', cell: (s) => <Button size="sm" variant="outline" loading={revoke.isPending && revoke.variables === s.id} onClick={() => revoke.mutate(s.id)}>Sign out</Button> },
          ]}
        />
      )}
    </QueryState>
  )
}
