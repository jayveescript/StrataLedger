import { Building2, CalendarDays, Home } from 'lucide-react'
import { usePortal } from '@/api/portal'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/atoms'
import { DescriptionList, EmptyState, PageHeader, QueryState } from '@/components/molecules'
import { formatCurrency, formatDate } from '@/lib/format'

/** Owner home: their lots, entitlement share, and each plan's fund position. */
export function PortalHomePage() {
  const query = usePortal()
  return (
    <QueryState query={query}>
      {(p) => (
        <>
          <PageHeader title={`Welcome, ${p.firstName}`} description="Your property at a glance." />
          {p.lots.length === 0 ? (
            <Card><EmptyState icon={Home} title="No lots linked yet" description="Your strata manager will link your lot to your account shortly." /></Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {p.lots.map((l) => (
                <Card key={l.lotId}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-primary/15 p-2"><Building2 className="h-5 w-5 text-ink" /></span>
                      <div><CardTitle>{l.planName}</CardTitle><p className="text-xs text-ink-muted">{l.address}</p></div>
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-5">
                    <DescriptionList items={[
                      { label: 'Lot', value: `${l.lotNumber}${l.unitNumber ? ` · Unit ${l.unitNumber}` : ''}` },
                      { label: 'Type', value: l.type },
                      { label: 'Your ownership', value: `${l.sharePercent}%` },
                      { label: 'Entitlement', value: `${l.entitlementUnits} of ${l.planTotalEntitlement} (${l.planTotalEntitlement ? ((l.entitlementUnits / l.planTotalEntitlement) * 100).toFixed(1) : 0}%)` },
                    ]} />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-surface p-3"><p className="text-xs text-ink-muted">Admin fund</p><p className="text-lg font-semibold text-ink">{formatCurrency(l.adminFundBalance)}</p></div>
                      <div className="rounded-lg bg-surface p-3"><p className="text-xs text-ink-muted">Capital works fund</p><p className="text-lg font-semibold text-ink">{formatCurrency(l.capitalWorksFundBalance)}</p></div>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-ink-soft"><CalendarDays className="h-4 w-4" />Next AGM: {formatDate(l.nextAgmDate)}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </QueryState>
  )
}
