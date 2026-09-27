import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/atoms'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

/** Debounced search box: the parent only re-queries after the user pauses typing. */
export function SearchInput({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState(value)
  const debounced = useDebouncedValue(draft, 300)

  useEffect(() => {
    if (debounced !== value) onChange(debounced)
  }, [debounced, value, onChange])

  return (
    <div className="relative w-full sm:w-72">
      <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="pl-9" aria-label={placeholder} />
    </div>
  )
}
