import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'info' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, { icon: LucideIcon; className: string }> = {
  info: { icon: Info, className: 'border-info/30 bg-info/10 text-info' },
  success: { icon: CircleCheck, className: 'border-success/30 bg-success/10 text-success' },
  warning: { icon: TriangleAlert, className: 'border-warning/30 bg-warning/10 text-warning' },
  danger: { icon: CircleAlert, className: 'border-danger/30 bg-danger/10 text-danger' },
}

export function Alert({ tone = 'info', title, children, className }: { tone?: Tone; title?: string; children?: ReactNode; className?: string }) {
  const { icon: Icon, className: toneClass } = tones[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border px-4 py-3 text-sm', toneClass, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1 text-ink">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-ink-soft">{children}</div>}
      </div>
    </div>
  )
}
