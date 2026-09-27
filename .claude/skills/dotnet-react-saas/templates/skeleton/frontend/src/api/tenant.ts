import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { qk } from './queryKeys'
import type {
  AuditLogEntry, Branding, TenantUser, Invitation, InvitationBatchResult, InvitationRowInput, InvitationStatus,
  InvitationUploadPreview, Paged, Usage, UserRole,
} from './types'

/** Tenant-scoped endpoints accept an optional tenantId so Super Admin can act on any tenant. */
const scope = (tenantId?: string) => (tenantId ? { tenantId } : undefined)

export const useUsage = (tenantId?: string) =>
  useQuery({ queryKey: qk.usage(tenantId), queryFn: () => http.get<Usage>('/tenant/usage', scope(tenantId)) })

export const useBranding = (tenantId?: string) =>
  useQuery({ queryKey: qk.branding(tenantId), queryFn: () => http.get<Branding>('/tenant/branding', scope(tenantId)) })

export function useUpdateBranding(tenantId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<Branding, 'logoUrl'>) => http.put<Branding>('/tenant/branding', { ...body }, scope(tenantId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.branding(tenantId) }),
  })
}

export function useUploadLogo(tenantId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return http.post<Branding>('/tenant/branding/logo', form, scope(tenantId))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.branding(tenantId) }),
  })
}

export interface UserQuery { tenantId?: string; search?: string; role?: UserRole; page?: number }

export const useTenantUsers = (query: UserQuery) =>
  useQuery({
    queryKey: qk.tenantUsers(query),
    queryFn: () => http.get<Paged<TenantUser>>('/tenant/users', { ...query }),
    placeholderData: keepPreviousData,
  })

function useUserMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'users'] }) })
}

export const useUpdateUser = () =>
  useUserMutation(({ id, ...body }: { id: string; role: UserRole; isCommitteeMember: boolean; isActive: boolean }) =>
    http.put<void>(`/tenant/users/${id}`, body))
export const useRevokeUserSessions = () => useUserMutation((id: string) => http.post<void>(`/tenant/users/${id}/revoke-sessions`))
export const useUnlockUser = () => useUserMutation((id: string) => http.post<void>(`/tenant/users/${id}/unlock`))

export interface InvitationQuery { tenantId?: string; status?: InvitationStatus; search?: string; page?: number }

export const useInvitations = (query: InvitationQuery) =>
  useQuery({
    queryKey: qk.invitations(query),
    queryFn: () => http.get<Paged<Invitation>>('/tenant/invitations', { ...query }),
    placeholderData: keepPreviousData,
  })

export const usePreviewInvitations = (tenantId?: string) =>
  useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return http.post<InvitationUploadPreview>('/tenant/invitations/preview', form, scope(tenantId))
    },
  })

function useInvitationMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: ['tenant', 'invitations'] }),
      qc.invalidateQueries({ queryKey: ['members'] }),
    ]),
  })
}

export const useSendInvitations = (tenantId?: string) =>
  useInvitationMutation((body: { fileName: string; rows: InvitationRowInput[] }) =>
    http.post<InvitationBatchResult>('/tenant/invitations', { ...body }, scope(tenantId)))
export const useResendInvitation = () => useInvitationMutation((id: string) => http.post<void>(`/tenant/invitations/${id}/resend`))
export const useRevokeInvitation = () => useInvitationMutation((id: string) => http.delete<void>(`/tenant/invitations/${id}`))

export interface AuditQuery { tenantId?: string; action?: string; page?: number }

export const useAuditLogs = (query: AuditQuery) =>
  useQuery({
    queryKey: qk.auditLogs(query),
    queryFn: () => http.get<Paged<AuditLogEntry>>('/tenant/audit-logs', { ...query }),
    placeholderData: keepPreviousData,
  })
