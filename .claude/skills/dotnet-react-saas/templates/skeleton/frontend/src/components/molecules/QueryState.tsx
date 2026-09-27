import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ApiError } from '@/api/http'
import { Skeleton } from '@/components/atoms'
import { Alert } from './Alert'
import { FeatureLockNotice } from './FeatureLockNotice'

/** Standard loading / error / locked-feature handling around a query, so pages only render the happy path. */
export function QueryState<T>({ query, children, skeleton }: { query: UseQueryResult<T>; children: (data: T) => ReactNode; skeleton?: ReactNode }) {
  if (query.isPending) return <>{skeleton ?? <div className="space-y-3"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-40 w-full" /></div>}</>
  if (query.error instanceof ApiError && query.error.isFeatureLocked) return <FeatureLockNotice feature={query.error.feature} />
  if (query.isError) return <Alert tone="danger" title="Could not load data">{query.error.message}</Alert>
  return <>{children(query.data)}</>
}
