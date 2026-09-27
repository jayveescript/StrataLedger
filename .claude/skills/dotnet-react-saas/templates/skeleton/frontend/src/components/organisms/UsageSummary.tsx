import type { Usage } from '@/api/types'
import { Card, CardBody, CardHeader, CardTitle, ProgressBar } from '@/components/atoms'
import { StatusBadge } from '@/components/molecules'
import { formatBytes, formatCents } from '@/lib/format'

/** Plan limits and the estimated monthly bill (base + per-seat overage). */
export function UsageSummary({ usage }: { usage: Usage }) {
  const p = usage.pricing
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Items</CardTitle><StatusBadge value={usage.tier} label={usage.tierName} /></CardHeader>
        <CardBody className="space-y-2">
          <p className="text-2xl font-bold text-ink">{usage.items}<span className="text-base font-normal text-ink-muted"> / {usage.maxItems ?? '∞'}</span></p>
          {usage.maxItems !== null && <ProgressBar value={usage.items} max={usage.maxItems} />}
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Seats</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          <p className="text-2xl font-bold text-ink">{p.seatCount}<span className="text-base font-normal text-ink-muted"> / {p.includedSeats} included</span></p>
          <ProgressBar value={p.seatCount} max={p.includedSeats} />
          {p.billableOverageSeats > 0 && <p className="text-xs text-warning">{p.billableOverageSeats} extra seats at {formatCents(p.perSeatOverageCents)} each</p>}
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
          <p className="text-sm text-ink-soft">{formatCents(p.monthlyBaseCents)} base + {p.billableOverageSeats} × {formatCents(p.perSeatOverageCents)} seat overage</p>
        </CardBody>
      </Card>
    </div>
  )
}
