import { ArrowLeft, LogOut, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useChangeStatus, useChangeTier, useTenant, useForceLogout } from '@/api/platform'
import { TIERS, type TenantStatus, type SubscriptionTier } from '@/api/types'
import { Button, Card, CardBody, CardHeader, CardTitle, Logo, Select } from '@/components/atoms'
import { Alert, ConfirmDialog, DescriptionList, PageHeader, QueryState, StatusBadge, Tabs } from '@/components/molecules'
import { BrandingEditor, TenantFormDialog, FeatureMatrix, UsageSummary } from '@/components/organisms'
import { errorMessage } from '@/lib/apiErrors'
import { formatDate } from '@/lib/format'
import { AuditLogPanel } from '../tenant/AuditLogPage'
import { InvitationsPanel } from '../tenant/InvitationsPage'
import { UsersPanel } from '../tenant/UsersPage'

const STATUSES: TenantStatus[] = ['Active', 'Suspended', 'Cancelled']

/** Super Admin control centre for one tenant: subscription, features, users, invitations, branding and audit. */
export function TenantDetailPage() {
  const { id = '' } = useParams()
  const query = useTenant(id)
  const changeTier = useChangeTier(id)
  const changeStatus = useChangeStatus(id)
  const forceLogout = useForceLogout(id)
  const [editing, setEditing] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const error = changeTier.error ?? changeStatus.error ?? forceLogout.error

  return (
    <QueryState query={query}>
      {(c) => (
        <>
          <Link to="/platform/tenants" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" />All tenants</Link>
          <PageHeader
            title={c.name}
            description={`${c.slug} · customer since ${formatDate(c.createdAt)}`}
            actions={
              <>
                <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>
                <Button variant="outline" onClick={() => setConfirmLogout(true)}><LogOut className="h-4 w-4" />Force sign-out</Button>
              </>
            }
          />
          {error && <Alert tone="danger" className="mb-4">{errorMessage(error)}</Alert>}
          {forceLogout.data && <Alert tone="success" className="mb-4">Signed out {forceLogout.data.revoked} session(s).</Alert>}
          <Tabs tabs={[
            {
              id: 'overview', label: 'Overview', content: () => (
                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Subscription</CardTitle><StatusBadge value={c.status} /></CardHeader>
                    <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5"><p className="text-sm font-medium">Tier</p>
                        <Select value={c.tier} onChange={(e) => changeTier.mutate(e.target.value as SubscriptionTier)} options={TIERS.map((t) => ({ value: t, label: t }))} aria-label="Tier" /></div>
                      <div className="space-y-1.5"><p className="text-sm font-medium">Status</p>
                        <Select value={c.status} onChange={(e) => changeStatus.mutate(e.target.value as TenantStatus)} options={STATUSES.map((s) => ({ value: s, label: s }))} aria-label="Status" /></div>
                      <p className="text-xs text-ink-muted sm:self-end">Suspending a tenant signs everyone out and blocks sign-in until reactivated.</p>
                    </CardBody>
                  </Card>
                  <UsageSummary usage={c.usage} />
                  <Card>
                    <CardHeader><CardTitle>Tenant details</CardTitle><Logo branding={c.branding} size="sm" /></CardHeader>
                    <CardBody>
                      <DescriptionList items={[
                        { label: 'Tax number', value: c.taxId },
                        { label: 'Contact', value: c.contactName }, { label: 'Email', value: c.contactEmail }, { label: 'Phone', value: c.phone },
                      ]} />
                    </CardBody>
                  </Card>
                </div>
              ),
            },
            { id: 'features', label: 'Feature access', content: () => <Card><FeatureMatrix tenantId={c.id} /></Card> },
            { id: 'invitations', label: 'Invitations', content: () => <InvitationsPanel tenantId={c.id} /> },
            { id: 'users', label: 'Users', content: () => <UsersPanel tenantId={c.id} /> },
            { id: 'branding', label: 'Branding', content: () => <BrandingEditor key={c.id} initial={c.branding} tenantId={c.id} /> },
            { id: 'audit', label: 'Audit log', content: () => <AuditLogPanel tenantId={c.id} /> },
          ]} />
          <TenantFormDialog open={editing} onOpenChange={setEditing} tenant={c} />
          <ConfirmDialog open={confirmLogout} onOpenChange={setConfirmLogout} destructive title={`Sign out everyone at ${c.name}?`} confirmLabel="Force sign-out"
            description="All access and refresh tokens for this tenant are revoked immediately. Users will need to sign in again."
            loading={forceLogout.isPending} onConfirm={() => void forceLogout.mutateAsync().finally(() => setConfirmLogout(false))} />
        </>
      )}
    </QueryState>
  )
}
