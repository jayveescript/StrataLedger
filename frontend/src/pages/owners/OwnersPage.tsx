import { Plus, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { useOwners } from '@/api/strata'
import { Button, Card } from '@/components/atoms'
import { EmptyState, PageHeader, Pagination, QueryState, SearchInput, StatusBadge } from '@/components/molecules'
import { DataTable, OwnerFormDialog } from '@/components/organisms'
import { useAccess } from '@/auth/useAuth'

export function OwnersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const canWrite = useAccess({ permission: 'OwnersWrite' }) === 'allowed'
  const query = useOwners({ search, page })
  const onSearch = useCallback((v: string) => { setSearch(v); setPage(1) }, [])

  return (
    <>
      <PageHeader title="Owners" description="Lot owners across your strata plans and their portal access."
        actions={canWrite && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />New owner</Button>} />
      <Card>
        <div className="border-b border-line p-4"><SearchInput value={search} onChange={onSearch} placeholder="Search name, email or entity" /></div>
        <QueryState query={query}>
          {(data) => (
            <>
              <DataTable
                rows={data.items}
                rowKey={(o) => o.id}
                onRowClick={(o) => navigate(`/owners/${o.id}`)}
                empty={<EmptyState icon={Users} title="No owners found" />}
                columns={[
                  { key: 'name', header: 'Name', cell: (o) => <div><p className="font-medium">{o.firstName} {o.lastName}</p>{o.entityName && <p className="text-xs text-ink-muted">{o.entityName}</p>}</div> },
                  { key: 'email', header: 'Email', cell: (o) => o.email },
                  { key: 'phone', header: 'Phone', cell: (o) => o.phone ?? '—' },
                  { key: 'lots', header: 'Lots', cell: (o) => o.lotCount },
                  { key: 'portal', header: 'Portal', cell: (o) => <StatusBadge value={o.portalStatus} label={o.portalStatus === 'None' ? 'Not invited' : undefined} /> },
                ]}
              />
              <Pagination page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onPageChange={setPage} />
            </>
          )}
        </QueryState>
      </Card>
      <OwnerFormDialog open={creating} onOpenChange={setCreating} onCreated={(id) => navigate(`/owners/${id}`)} />
    </>
  )
}
