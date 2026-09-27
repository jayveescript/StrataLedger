import { Lock } from 'lucide-react'
import { Card } from '@/components/atoms'
import { humanize } from '@/lib/format'

export function FeatureLockNotice({ feature }: { feature?: string }) {
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <span className="mx-auto mb-3 inline-flex rounded-full bg-primary/15 p-3 text-ink"><Lock className="h-6 w-6" /></span>
      <h2 className="text-lg font-semibold text-ink">{feature ? `${humanize(feature)} is not in your plan` : 'This feature is not in your plan'}</h2>
      <p className="mt-2 text-sm text-ink-soft">Upgrade your subscription to unlock it. Contact your StrataLedger account manager and it can be enabled for your company straight away.</p>
    </Card>
  )
}
