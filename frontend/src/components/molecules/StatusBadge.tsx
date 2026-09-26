import { Badge, type BadgeTone } from '@/components/atoms'
import { humanize } from '@/lib/format'

/** One lookup for every status-like enum in the app. */
const TONES: Record<string, BadgeTone> = {
  Active: 'success', Healthy: 'success', Accepted: 'success', Occupied: 'success', Enabled: 'success',
  Pending: 'info', Invited: 'info', Onboarding: 'info', Tenanted: 'info',
  AtRisk: 'warning', Suspended: 'warning', Expired: 'warning', Vacant: 'neutral',
  Critical: 'danger', Cancelled: 'danger', Revoked: 'danger', Locked: 'danger', Disabled: 'danger',
  Starter: 'neutral', Professional: 'info', Enterprise: 'primary', None: 'neutral', Archived: 'neutral',
}

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return <Badge tone={TONES[value] ?? 'neutral'}>{label ?? humanize(value)}</Badge>
}
