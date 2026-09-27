import { Building2, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { usePlans } from '@/api/strata'
import { AU_STATES, type AustralianState } from '@/api/types'
import { Button, Card, Select } from '@/components/atoms'
import { EmptyState, PageHeader, Pagination, QueryState, SearchInput, StatusBadge } from '@/components/molecules'
import { DataTable, PlanFormDialog } from '@/components/organisms'
import { useAccess } from '@/auth/useAuth'
import { formatCurrency, formatDate } from '@/lib/format'

export function PlansPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [state, setState] = useState<AustralianState | ''>('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const canWrite = useAccess({ permission: 'PlansWrite' }) === 'allowed'
  const query = usePlans({ search, state: state || undefined, page })
  const onSearch = useCallback((v: string) => { setSearch(v); setPage(1) }, [])

  return (
    <>
      <PageHeader
        title="Strata plans"
        description="Buildings under management and their fund positions."
        actions={canWrite && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />New plan</Button>}
      />
      <Card>
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <SearchInput value={search} onChange={onSearch} placeholder="Search name, number or address" />
          <div className="w-40">
            <Select aria-label="State" placeholder="All states" value={state} onChange={(e) => { setState(e.target.value as AustralianState | ''); setPage(1) }}
              options={AU_STATES.map((s) => ({ value: s, label: s }))} />
          </div>
        </div>
        <QueryState query={query}>
          {(data) => (
            <>
              <DataTable
                rows={data.items}
                rowKey={(p) => p.id}
                onRowClick={(p) => navigate(`/strata-plans/${p.id}`)}
                empty={<EmptyState icon={Building2} title="No strata plans yet" description="Add your first building to start managing lots and owners." />}
                columns={[
                  { key: 'name', header: 'Plan', cell: (p) => <div><p className="font-medium">{p.name}</p><p className="text-xs text-ink-muted">{p.planNumber} · {p.address}</p></div> },
                  { key: 'state', header: 'State', cell: (p) => p.state },
                  { key: 'lots', header: 'Lots', cell: (p) => p.totalLots },
                  { key: 'owners', header: 'Owners', cell: (p) => p.ownerCount },
                  { key: 'admin', header: 'Admin fund', cell: (p) => formatCurrency(p.adminFundBalance) },
                  { key: 'cw', header: 'Capital works', cell: (p) => formatCurrency(p.capitalWorksFundBalance) },
                  { key: 'agm', header: 'Next AGM', cell: (p) => formatDate(p.nextAgmDate) },
                  { key: 'health', header: 'Health', cell: (p) => <StatusBadge value={p.health} /> },
                ]}
              />
              <Pagination page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onPageChange={setPage} />
            </>
          )}
        </QueryState>
      </Card>
      <PlanFormDialog open={creating} onOpenChange={setCreating} />
    </>
  )
}
