import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { qk } from './queryKeys'
import type {
  CompanyDetail, CompanyInput, CompanyListItem, CompanyStatus, Feature, FeatureAccess, Paged, SubscriptionTier, Tier,
} from './types'

export interface CompanyQuery { search?: string; status?: CompanyStatus; tier?: SubscriptionTier; page?: number }

export const useCompanies = (query: CompanyQuery) =>
  useQuery({
    queryKey: qk.companies(query),
    queryFn: () => http.get<Paged<CompanyListItem>>('/platform/companies', { ...query }),
    placeholderData: keepPreviousData,
  })

export const useCompany = (id: string) =>
  useQuery({ queryKey: qk.company(id), queryFn: () => http.get<CompanyDetail>(`/platform/companies/${id}`) })

export const useCompanyFeatures = (id: string) =>
  useQuery({ queryKey: qk.companyFeatures(id), queryFn: () => http.get<FeatureAccess[]>(`/platform/companies/${id}/features`) })

export const useTiers = () => useQuery({ queryKey: qk.tiers, queryFn: () => http.get<Tier[]>('/platform/tiers') })

function usePlatformMutation<TVars, TResult = unknown>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ['platform'] }) })
}

export const useCreateCompany = () =>
  usePlatformMutation((body: CompanyInput & { tier: SubscriptionTier }) => http.post<{ id: string }>('/platform/companies', { ...body }))
export const useUpdateCompany = (id: string) =>
  usePlatformMutation((body: CompanyInput) => http.put<void>(`/platform/companies/${id}`, { ...body }))
export const useChangeTier = (id: string) =>
  usePlatformMutation((tier: SubscriptionTier) => http.put<void>(`/platform/companies/${id}/tier`, { tier }))
export const useChangeStatus = (id: string) =>
  usePlatformMutation((status: CompanyStatus) => http.put<void>(`/platform/companies/${id}/status`, { status }))
export const useForceLogout = (id: string) =>
  usePlatformMutation(() => http.post<{ revoked: number }>(`/platform/companies/${id}/force-logout`))
export const useSetFeature = (id: string) =>
  usePlatformMutation(({ feature, ...body }: { feature: Feature; enabled: boolean; expiresAt: string | null; note: string | null }) =>
    http.put<void>(`/platform/companies/${id}/features/${feature}`, body))
export const useClearFeature = (id: string) =>
  usePlatformMutation((feature: Feature) => http.delete<void>(`/platform/companies/${id}/features/${feature}`))
export const useUpdateTier = () => usePlatformMutation((tier: Tier) => http.put<void>(`/platform/tiers/${tier.tier}`, { ...tier }))
