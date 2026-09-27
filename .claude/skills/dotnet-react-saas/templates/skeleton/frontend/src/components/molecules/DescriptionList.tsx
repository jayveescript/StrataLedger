import type { ReactNode } from 'react'

export function DescriptionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{item.label}</dt>
          <dd className="mt-1 text-sm text-ink">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
