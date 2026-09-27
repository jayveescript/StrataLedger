import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { qk } from './queryKeys'
import type {
  TenantDetail, TenantInput, TenantListItem, TenantStatus, Feature, FeatureAccess, Paged, SubscriptionTier, Tier,
} from './types'

export interface TenantQuery { search?: string; status?: TenantStatus; tier?: SubscriptionTier; page?: number }

export const useTenants = (query: TenantQuery) =>
  useQuery({
    queryKey: qk.tenants(query),
    queryFn: () => http.get<Paged<TenantListItem>>('/platform/tenants', { ...query }),
    placeholderData: keepPreviousData,
  })

export const useTenant = (id: string) =>
  useQuery({ queryKey: qk.tenant(id), queryFn: () => http.get<TenantDetail>(`/platform/tenants/${id}`) })

export const useTenantFeatures = (id: string) =>
  useQuery({ queryKey: qk.tenantFeatures(id), queryFn: () => http.get<FeatureAccess[]>(`/platform/tenants/${id}/features`) })

export const useTiers = () => useQuery({ queryKey: qk.tiers, queryFn: () => http.get<Tier[]>('/platform/tiers') })

function usePlatformMutation<TVars, TResult = unknown>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ['platform'] }) })
}

export const useCreateTenant = () =>
  usePlatformMutation((body: TenantInput & { tier: SubscriptionTier }) => http.post<{ id: string }>('/platform/tenants', { ...body }))
export const useUpdateTenant = (id: string) =>
  usePlatformMutation((body: TenantInput) => http.put<void>(`/platform/tenants/${id}`, { ...body }))
export const useChangeTier = (id: string) =>
  usePlatformMutation((tier: SubscriptionTier) => http.put<void>(`/platform/tenants/${id}/tier`, { tier }))
export const useChangeStatus = (id: string) =>
  usePlatformMutation((status: TenantStatus) => http.put<void>(`/platform/tenants/${id}/status`, { status }))
export const useForceLogout = (id: string) =>
  usePlatformMutation(() => http.post<{ revoked: number }>(`/platform/tenants/${id}/force-logout`))
export const useSetFeature = (id: string) =>
  usePlatformMutation(({ feature, ...body }: { feature: Feature; enabled: boolean; expiresAt: string | null; note: string | null }) =>
    http.put<void>(`/platform/tenants/${id}/features/${feature}`, body))
export const useClearFeature = (id: string) =>
  usePlatformMutation((feature: Feature) => http.delete<void>(`/platform/tenants/${id}/features/${feature}`))
export const useUpdateTier = () => usePlatformMutation((tier: Tier) => http.put<void>(`/platform/tiers/${tier.tier}`, { ...tier }))
