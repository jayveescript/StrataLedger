import { cn } from '@/lib/cn'

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
  return (
    <span className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-fg', className)}>
      {initials || '?'}
    </span>
  )
}
