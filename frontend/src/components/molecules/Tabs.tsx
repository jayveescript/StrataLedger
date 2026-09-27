import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TabDefinition {
  id: string
  label: string
  content: () => ReactNode
}

/** Lightweight accessible tabs; content renders lazily so hidden tabs don't fetch. */
export function Tabs({ tabs, initial }: { tabs: TabDefinition[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id)
  const current = tabs.find((t) => t.id === active) ?? tabs[0]
  return (
    <div>
      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={t.id === current?.id}
            onClick={() => setActive(t.id)}
            className={cn('-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              t.id === current?.id ? 'border-primary text-ink' : 'border-transparent text-ink-muted hover:text-ink')}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current?.content()}</div>
    </div>
  )
}
