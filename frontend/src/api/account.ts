import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { qk } from './queryKeys'
import type { Session } from './types'

export const useSessions = () => useQuery({ queryKey: qk.sessions, queryFn: () => http.get<Session[]>('/account/sessions') })

export function useRevokeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => http.delete<void>(`/account/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.sessions }),
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) => http.post<void>('/account/password', body),
  })

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: (body: { firstName: string; lastName: string; phoneNumber: string | null }) => http.put<void>('/account/profile', body),
  })
