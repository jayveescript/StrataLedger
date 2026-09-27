import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/atoms'

export function Pagination({ page, totalPages, totalCount, onPageChange }: { page: number; totalPages: number; totalCount: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return <p className="px-5 py-3 text-xs text-ink-muted">{totalCount} record{totalCount === 1 ? '' : 's'}</p>
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <p className="text-xs text-ink-muted">Page {page} of {totalPages} · {totalCount} records</p>
      <div className="flex gap-1">
        <Button variant="outline" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
