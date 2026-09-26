import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { qk } from './queryKeys'
import type {
  AustralianState, DashboardSummary, Lot, LotStatus, LotType, OwnerDetail, OwnerInput, OwnerListItem, Paged,
  PlanHealth, PlanStatus, StrataPlanDetail, StrataPlanListItem,
} from './types'

export interface PlanQuery { search?: string; state?: AustralianState; page?: number; pageSize?: number }
export interface OwnerQuery { search?: string; strataPlanId?: string; page?: number; pageSize?: number }

export interface PlanInput {
  name: string
  planNumber: string
  address: string
  state: AustralianState
  financialYearStart: string
  nextAgmDate: string | null
  adminFundBalance: number
  capitalWorksFundBalance: number
}

export interface PlanUpdate extends Omit<PlanInput, 'planNumber' | 'adminFundBalance' | 'capitalWorksFundBalance'> {
  status: PlanStatus
  health: PlanHealth
}

export interface LotInput {
  lotNumber: string
  unitNumber: string | null
  floor: number | null
  type: LotType
  entitlementUnits: number
  status?: LotStatus
}

export const useDashboard = () => useQuery({ queryKey: qk.dashboard, queryFn: () => http.get<DashboardSummary>('/dashboard') })

export const usePlans = (query: PlanQuery) =>
  useQuery({
    queryKey: qk.plans(query),
    queryFn: ({ signal }) => http.get<Paged<StrataPlanListItem>>('/strata-plans', { ...query }, signal),
    placeholderData: keepPreviousData,
  })

export const usePlan = (id: string) =>
  useQuery({ queryKey: qk.plan(id), queryFn: () => http.get<StrataPlanDetail>(`/strata-plans/${id}`) })

export const useOwners = (query: OwnerQuery) =>
  useQuery({
    queryKey: qk.owners(query),
    queryFn: ({ signal }) => http.get<Paged<OwnerListItem>>('/owners', { ...query }, signal),
    placeholderData: keepPreviousData,
  })

export const useOwner = (id: string) =>
  useQuery({ queryKey: qk.owner(id), queryFn: () => http.get<OwnerDetail>(`/owners/${id}`) })

/** Mutations invalidate every strata-related list; they are cheap and keep counts consistent. */
function useStrataMutation<TVars, TResult = unknown>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['plans'] }),
        qc.invalidateQueries({ queryKey: ['owners'] }),
        qc.invalidateQueries({ queryKey: qk.dashboard }),
      ])
    },
  })
}

export const useCreatePlan = () => useStrataMutation((body: PlanInput) => http.post<{ id: string }>('/strata-plans', { ...body }))
export const useUpdatePlan = (id: string) => useStrataMutation((body: PlanUpdate) => http.put<void>(`/strata-plans/${id}`, { ...body }))
export const useDeletePlan = () => useStrataMutation((id: string) => http.delete<void>(`/strata-plans/${id}`))

export const useCreateLot = (planId: string) =>
  useStrataMutation((body: LotInput) => http.post<{ id: string }>(`/strata-plans/${planId}/lots`, { ...body }))
export const useUpdateLot = () =>
  useStrataMutation(({ id, ...body }: LotInput & { id: string; status: LotStatus }) => http.put<void>(`/lots/${id}`, { ...body }))
export const useDeleteLot = () => useStrataMutation((id: string) => http.delete<void>(`/lots/${id}`))
export const useAssignLotOwner = () =>
  useStrataMutation(({ lotId, ownerId, sharePercent }: { lotId: string; ownerId: string; sharePercent: number }) =>
    http.post<void>(`/lots/${lotId}/owners`, { ownerId, sharePercent }))
export const useRemoveLotOwner = () =>
  useStrataMutation(({ lotId, ownerId }: { lotId: string; ownerId: string }) => http.delete<void>(`/lots/${lotId}/owners/${ownerId}`))

export const useCreateOwner = () => useStrataMutation((body: OwnerInput) => http.post<{ id: string }>('/owners', { ...body }))
export const useUpdateOwner = (id: string) => useStrataMutation((body: OwnerInput) => http.put<void>(`/owners/${id}`, { ...body }))
export const useDeleteOwner = () => useStrataMutation((id: string) => http.delete<void>(`/owners/${id}`))
export const useInviteOwner = () => useStrataMutation((id: string) => http.post<void>(`/owners/${id}/invite`))

export type { Lot }
