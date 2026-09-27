import { Building2, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTenants } from '@/api/platform'
import { TIERS, type SubscriptionTier } from '@/api/types'
import { Button, Card, Select } from '@/components/atoms'
import { EmptyState, PageHeader, Pagination, QueryState, SearchInput, StatusBadge } from '@/components/molecules'
import { TenantFormDialog, DataTable } from '@/components/organisms'
import { formatDate } from '@/lib/format'

export function TenantsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState<SubscriptionTier | ''>('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const query = useTenants({ search, tier: tier || undefined, page })
  const onSearch = useCallback((v: string) => { setSearch(v); setPage(1) }, [])

  return (
    <>
      <PageHeader title="Tenants" description="Every customer tenant. Onboard a tenant, then upload its email list."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Onboard tenant</Button>} />
      <Card>
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <SearchInput value={search} onChange={onSearch} placeholder="Search tenant or email" />
          <div className="w-44"><Select aria-label="Tier" placeholder="All tiers" value={tier} onChange={(e) => { setTier(e.target.value as SubscriptionTier | ''); setPage(1) }} options={TIERS.map((t) => ({ value: t, label: t }))} /></div>
        </div>
        <QueryState query={query}>
          {(data) => (
            <>
              <DataTable
                rows={data.items}
                rowKey={(c) => c.id}
                onRowClick={(c) => navigate(`/platform/tenants/${c.id}`)}
                empty={<EmptyState icon={Building2} title="No tenants yet" />}
                columns={[
                  { key: 'name', header: 'Tenant', cell: (c) => <div><p className="font-medium">{c.name}</p><p className="text-xs text-ink-muted">{c.contactEmail}</p></div> },
                  { key: 'tier', header: 'Tier', cell: (c) => <StatusBadge value={c.tier} /> },
                  { key: 'items', header: 'Items', cell: (c) => c.itemCount },
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
      <TenantFormDialog open={creating} onOpenChange={setCreating} onCreated={(id) => navigate(`/platform/tenants/${id}`)} />
    </>
  )
}
