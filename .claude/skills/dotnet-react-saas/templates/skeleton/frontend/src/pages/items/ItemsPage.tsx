import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDeleteItem, useItems } from '@/api/items'
import type { Item } from '@/api/types'
import { Button, Card } from '@/components/atoms'
import { ConfirmDialog, EmptyState, PageHeader, Pagination, QueryState, SearchInput, StatusBadge } from '@/components/molecules'
import { DataTable, ItemFormDialog } from '@/components/organisms'
import { useAccess } from '@/auth/useAuth'
import { formatCurrency, formatDate } from '@/lib/format'

/** Reference list page: search + pagination via query hook, permission-aware actions, dialogs for create/edit/delete. */
export function ItemsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<{ open: boolean; item?: Item }>({ open: false })
  const [deleting, setDeleting] = useState<Item | null>(null)
  const canWrite = useAccess({ permission: 'ItemsWrite' }) === 'allowed'
  const query = useItems({ search, page })
  const remove = useDeleteItem()
  const onSearch = useCallback((v: string) => { setSearch(v); setPage(1) }, [])

  return (
    <>
      <PageHeader title="Items" description="Example module — copy this page for your own resources."
        actions={canWrite && <Button onClick={() => setEditing({ open: true })}><Plus className="h-4 w-4" />New item</Button>} />
      <Card>
        <div className="border-b border-line p-4"><SearchInput value={search} onChange={onSearch} placeholder="Search items" /></div>
        <QueryState query={query}>
          {(data) => (
            <>
              <DataTable
                rows={data.items}
                rowKey={(i) => i.id}
                empty={<EmptyState icon={Boxes} title="No items yet" />}
                columns={[
                  { key: 'name', header: 'Name', cell: (i) => <div><p className="font-medium">{i.name}</p>{i.description && <p className="text-xs text-ink-muted">{i.description}</p>}</div> },
                  { key: 'amount', header: 'Amount', cell: (i) => formatCurrency(i.amount) },
                  { key: 'status', header: 'Status', cell: (i) => <StatusBadge value={i.status} /> },
                  { key: 'created', header: 'Created', cell: (i) => formatDate(i.createdAt) },
                  {
                    key: 'actions', header: '', className: 'text-right',
                    cell: (i) => canWrite && (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing({ open: true, item: i })}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setDeleting(i)}><Trash2 className="h-4 w-4" /></Button>
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
      <ItemFormDialog open={editing.open} onOpenChange={(open) => setEditing({ open })} item={editing.item} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} destructive title={`Delete ${deleting?.name}?`}
        description="The item is archived (soft-deleted) and kept for audit." confirmLabel="Delete" loading={remove.isPending}
        onConfirm={() => deleting && void remove.mutateAsync(deleting.id).then(() => setDeleting(null))} />
    </>
  )
}
