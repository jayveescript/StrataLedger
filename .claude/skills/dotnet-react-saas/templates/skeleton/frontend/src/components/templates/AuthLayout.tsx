import type { ReactNode } from 'react'
import { Card, Logo } from '@/components/atoms'
import { useBrand } from '@/brand/useBrand'

/** Centered card on the brand surface. Branding follows the tenant when known (e.g. invitation links). */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  const { branding } = useBrand()
  return (
    <div className="flex min-h-full items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo branding={branding} size="lg" />
          <p className="text-sm font-semibold uppercase tracking-wider text-ink-muted">{branding.displayName}</p>
        </div>
        <Card className="p-6 sm:p-8">
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </Card>
        <p className="mt-6 text-center text-xs text-ink-muted">Protected by multi-factor authentication · Powered by MyApp</p>
      </div>
    </div>
  )
}
