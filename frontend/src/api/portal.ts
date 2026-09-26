import { useQuery } from '@tanstack/react-query'
import { http } from './http'
import { qk } from './queryKeys'
import type { OwnerPortalSummary } from './types'

export const usePortal = () => useQuery({ queryKey: qk.portal, queryFn: () => http.get<OwnerPortalSummary>('/portal') })
