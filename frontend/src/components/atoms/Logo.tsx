import type { Branding } from '@/api/types'
import { cn } from '@/lib/cn'

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' } as const

/** Company logo image, or its monogram on the primary colour. */
export function Logo({ branding, size = 'md', className }: { branding: Branding; size?: keyof typeof sizes; className?: string }) {
  return branding.logoUrl ? (
    <img src={branding.logoUrl} alt={branding.displayName} className={cn(sizes[size], 'rounded-lg object-contain', className)} />
  ) : (
    <span
      aria-label={branding.displayName}
      className={cn(sizes[size], 'inline-flex shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-fg', className)}
    >
      {branding.logoMark}
    </span>
  )
}
