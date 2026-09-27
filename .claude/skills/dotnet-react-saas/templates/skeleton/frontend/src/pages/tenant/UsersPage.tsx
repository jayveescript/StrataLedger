import { KeyRound, LockOpen, LogOut, UserCog } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTenantUsers, useRevokeUserSessions, useUnlockUser, useUpdateUser } from '@/api/tenant'
import type { TenantUser, UserRole } from '@/api/types'
import { Badge, Button, Card, Checkbox, Select } from '@/components/atoms'
import { Alert, Dialog, EmptyState, FormField, PageHeader, Pagination, QueryState, SearchInput, StatusBadge } from '@/components/molecules'
import { DataTable } from '@/components/organisms'
import { useAccess, useAuth } from '@/auth/useAuth'
import { errorMessage } from '@/lib/apiErrors'
import { formatDateTime, humanize } from '@/lib/format'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = (['TenantAdmin', 'Manager', 'Viewer', 'Member'] as UserRole[]).map((r) => ({ value: r, label: humanize(r) }))

function EditUserDialog({ user, onClose }: { user: TenantUser | null; onClose: () => void }) {
  const update = useUpdateUser()
  const [role, setRole] = useState<UserRole>('Member')
  const [committee, setCommittee] = useState(false)
  const [active, setActive] = useState(true)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  if (user && loadedFor !== user.id) {
    setLoadedFor(user.id)
    setRole(user.role)
    setCommittee(user.isCommitteeMember)
    setActive(user.isActive)
  }

  const save = async () => {
    if (!user) return
    await update.mutateAsync({ id: user.id, role, isCommitteeMember: committee, isActive: active })
    onClose()
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()} title={`Edit ${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
      description="Role or status changes sign the user out everywhere immediately."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => void save()} loading={update.isPending}>Save</Button></>}>
      <div className="space-y-4">
        {update.isError && <Alert tone="danger">{errorMessage(update.error)}</Alert>}
        <FormField label="Role"><Select options={ROLE_OPTIONS} value={role} onChange={(e) => setRole(e.target.value as UserRole)} /></FormField>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={committee} onChange={(e) => setCommittee(e.target.checked)} />Committee member</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} />Account active</label>
      </div>
    </Dialog>
  )
}

export function UsersPanel({ tenantId }: { tenantId?: string }) {
  const { me } = useAuth()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<TenantUser | null>(null)
  const canManage = useAccess({ permission: 'TenantUsersManage' }) === 'allowed'
  const query = useTenantUsers({ tenantId, search, role: role || undefined, page })
  const revoke = useRevokeUserSessions()
  const unlock = useUnlockUser()
  const onSearch = useCallback((v: string) => { setSearch(v); setPage(1) }, [])

  return (
    <Card>
      <div className="flex flex-wrap gap-3 border-b border-line p-4">
        <SearchInput value={search} onChange={onSearch} placeholder="Search name or email" />
        <div className="w-48"><Select aria-label="Role" placeholder="All roles" value={role} onChange={(e) => { setRole(e.target.value as UserRole | ''); setPage(1) }} options={ROLE_OPTIONS} /></div>
      </div>
      {(revoke.isSuccess || unlock.isSuccess) && <Alert tone="success" className="m-4">Done.</Alert>}
      <QueryState query={query}>
        {(data) => (
          <>
            <DataTable
              rows={data.items}
              rowKey={(u) => u.id}
              empty={<EmptyState icon={UserCog} title="No users yet" description="Invite people from the Invitations page." />}
              columns={[
                { key: 'name', header: 'User', cell: (u) => <div><p className="font-medium">{u.firstName} {u.lastName}</p><p className="text-xs text-ink-muted">{u.email}</p></div> },
                { key: 'role', header: 'Role', cell: (u) => <span className="flex items-center gap-1">{humanize(u.role)}{u.isCommitteeMember && <Badge tone="info">Committee</Badge>}</span> },
                { key: 'mfa', header: 'MFA', cell: (u) => <StatusBadge value={u.mfaEnabled ? 'Enabled' : 'Disabled'} label={u.mfaEnabled ? 'On' : 'Off'} /> },
                { key: 'status', header: 'Status', cell: (u) => <StatusBadge value={u.isLockedOut ? 'Locked' : u.isActive ? 'Active' : 'Suspended'} label={u.isLockedOut ? 'Locked out' : u.isActive ? 'Active' : 'Deactivated'} /> },
                { key: 'last', header: 'Last sign-in', cell: (u) => formatDateTime(u.lastLoginAt) },
                {
                  key: 'actions', header: '', className: 'text-right',
                  cell: (u) => canManage && u.id !== me?.id && (
                    <div className="flex justify-end gap-1">
                      {u.isLockedOut && <Button size="icon" variant="ghost" aria-label="Unlock" onClick={() => unlock.mutate(u.id)}><LockOpen className="h-4 w-4" /></Button>}
                      <Button size="icon" variant="ghost" aria-label="Sign out everywhere" onClick={() => revoke.mutate(u.id)}><LogOut className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Edit role" onClick={() => setEditing(u)}><KeyRound className="h-4 w-4" /></Button>
                    </div>
                  ),
                },
              ]}
            />
            <Pagination page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onPageChange={setPage} />
          </>
        )}
      </QueryState>
      <EditUserDialog user={editing} onClose={() => setEditing(null)} />
    </Card>
  )
}

export function UsersPage() {
  return (
    <>
      <PageHeader title="Users & roles" description="Everyone with access to your tenant, their role and security status." />
      <UsersPanel />
    </>
  )
}
