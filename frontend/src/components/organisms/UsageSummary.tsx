import type { Usage } from '@/api/types'
import { Card, CardBody, CardHeader, CardTitle, ProgressBar } from '@/components/atoms'
import { StatusBadge } from '@/components/molecules'
import { formatBytes, formatCents } from '@/lib/format'

/** Plan limits and the estimated monthly bill (base + per-owner overage). */
export function UsageSummary({ usage }: { usage: Usage }) {
  const p = usage.pricing
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Strata plans</CardTitle><StatusBadge value={usage.tier} label={usage.tierName} /></CardHeader>
        <CardBody className="space-y-2">
          <p className="text-2xl font-bold text-ink">{usage.strataPlans}<span className="text-base font-normal text-ink-muted"> / {usage.maxStrataPlans ?? '∞'}</span></p>
          {usage.maxStrataPlans !== null && <ProgressBar value={usage.strataPlans} max={usage.maxStrataPlans} />}
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Owners</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          <p className="text-2xl font-bold text-ink">{p.ownerCount}<span className="text-base font-normal text-ink-muted"> / {p.includedOwners} included</span></p>
          <ProgressBar value={p.ownerCount} max={p.includedOwners} />
          {p.billableOverageOwners > 0 && <p className="text-xs text-warning">{p.billableOverageOwners} extra owners at {formatCents(p.perOwnerOverageCents)} each</p>}
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Storage</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          <p className="text-2xl font-bold text-ink">{formatBytes(usage.storageUsedBytes)}<span className="text-base font-normal text-ink-muted"> / {formatBytes(usage.storageQuotaBytes)}</span></p>
          <ProgressBar value={usage.storageUsedBytes} max={usage.storageQuotaBytes} />
        </CardBody>
      </Card>
      <Card className="md:col-span-3">
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-soft">Estimated monthly total</p>
            <p className="text-3xl font-bold text-ink">{formatCents(p.estimatedMonthlyCents)}</p>
          </div>
          <p className="text-sm text-ink-soft">{formatCents(p.monthlyBaseCents)} base + {p.billableOverageOwners} × {formatCents(p.perOwnerOverageCents)} owner overage</p>
        </CardBody>
      </Card>
    </div>
  )
}
