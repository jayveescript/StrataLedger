import { Building2, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { useCompanies } from '@/api/platform'
import { TIERS, type SubscriptionTier } from '@/api/types'
import { Button, Card, Select } from '@/components/atoms'
import { EmptyState, PageHeader, Pagination, QueryState, SearchInput, StatusBadge } from '@/components/molecules'
import { CompanyFormDialog, DataTable } from '@/components/organisms'
import { formatDate } from '@/lib/format'

export function CompaniesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState<SubscriptionTier | ''>('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const query = useCompanies({ search, tier: tier || undefined, page })
  const onSearch = useCallback((v: string) => { setSearch(v); setPage(1) }, [])

  return (
    <>
      <PageHeader title="Companies" description="Every customer tenant. Onboard a company, then upload its email list."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Onboard company</Button>} />
      <Card>
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <SearchInput value={search} onChange={onSearch} placeholder="Search company or email" />
          <div className="w-44"><Select aria-label="Tier" placeholder="All tiers" value={tier} onChange={(e) => { setTier(e.target.value as SubscriptionTier | ''); setPage(1) }} options={TIERS.map((t) => ({ value: t, label: t }))} /></div>
        </div>
        <QueryState query={query}>
          {(data) => (
            <>
              <DataTable
                rows={data.items}
                rowKey={(c) => c.id}
                onRowClick={(c) => navigate(`/platform/companies/${c.id}`)}
                empty={<EmptyState icon={Building2} title="No companies yet" />}
                columns={[
                  { key: 'name', header: 'Company', cell: (c) => <div><p className="font-medium">{c.name}</p><p className="text-xs text-ink-muted">{c.contactEmail}</p></div> },
                  { key: 'states', header: 'States', cell: (c) => c.states.join(', ') },
                  { key: 'tier', header: 'Tier', cell: (c) => <StatusBadge value={c.tier} /> },
                  { key: 'plans', header: 'Plans', cell: (c) => c.planCount },
                  { key: 'users', header: 'Users', cell: (c) => c.userCount },
                  { key: 'status', header: 'Status', cell: (c) => <StatusBadge value={c.status} /> },
                  { key: 'created', header: 'Since', cell: (c) => formatDate(c.createdAt) },
                ]}
              />
              <Pagination page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onPageChange={setPage} />
            </>
          )}
        </QueryState>
      </Card>
      <CompanyFormDialog open={creating} onOpenChange={setCreating} onCreated={(id) => navigate(`/platform/companies/${id}`)} />
    </>
  )
}
