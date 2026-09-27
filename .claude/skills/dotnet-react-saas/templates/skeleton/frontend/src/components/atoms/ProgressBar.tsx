import { cn } from '@/lib/cn'

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const tone = percent >= 90 ? 'bg-danger' : percent >= 75 ? 'bg-warning' : 'bg-primary'
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-ink/10', className)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${percent}%` }} />
    </div>
  )
}
