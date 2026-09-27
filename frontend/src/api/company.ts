import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { qk } from './queryKeys'
import type {
  AuditLogEntry, Branding, CompanyUser, Invitation, InvitationBatchResult, InvitationRowInput, InvitationStatus,
  InvitationUploadPreview, Paged, Usage, UserRole,
} from './types'

/** Company-scoped endpoints accept an optional companyId so Super Admin can act on any tenant. */
const scope = (companyId?: string) => (companyId ? { companyId } : undefined)

export const useUsage = (companyId?: string) =>
  useQuery({ queryKey: qk.usage(companyId), queryFn: () => http.get<Usage>('/company/usage', scope(companyId)) })

export const useBranding = (companyId?: string) =>
  useQuery({ queryKey: qk.branding(companyId), queryFn: () => http.get<Branding>('/company/branding', scope(companyId)) })

export function useUpdateBranding(companyId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<Branding, 'logoUrl'>) => http.put<Branding>('/company/branding', { ...body }, scope(companyId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.branding(companyId) }),
  })
}

export function useUploadLogo(companyId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return http.post<Branding>('/company/branding/logo', form, scope(companyId))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.branding(companyId) }),
  })
}

export interface UserQuery { companyId?: string; search?: string; role?: UserRole; page?: number }

export const useCompanyUsers = (query: UserQuery) =>
  useQuery({
    queryKey: qk.companyUsers(query),
    queryFn: () => http.get<Paged<CompanyUser>>('/company/users', { ...query }),
    placeholderData: keepPreviousData,
  })

function useUserMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'users'] }) })
}

export const useUpdateUser = () =>
  useUserMutation(({ id, ...body }: { id: string; role: UserRole; isCommitteeMember: boolean; isActive: boolean }) =>
    http.put<void>(`/company/users/${id}`, body))
export const useRevokeUserSessions = () => useUserMutation((id: string) => http.post<void>(`/company/users/${id}/revoke-sessions`))
export const useUnlockUser = () => useUserMutation((id: string) => http.post<void>(`/company/users/${id}/unlock`))

export interface InvitationQuery { companyId?: string; status?: InvitationStatus; search?: string; page?: number }

export const useInvitations = (query: InvitationQuery) =>
  useQuery({
    queryKey: qk.invitations(query),
    queryFn: () => http.get<Paged<Invitation>>('/company/invitations', { ...query }),
    placeholderData: keepPreviousData,
  })

export const usePreviewInvitations = (companyId?: string) =>
  useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return http.post<InvitationUploadPreview>('/company/invitations/preview', form, scope(companyId))
    },
  })

function useInvitationMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: ['company', 'invitations'] }),
      qc.invalidateQueries({ queryKey: ['owners'] }),
    ]),
  })
}

export const useSendInvitations = (companyId?: string) =>
  useInvitationMutation((body: { fileName: string; rows: InvitationRowInput[] }) =>
    http.post<InvitationBatchResult>('/company/invitations', { ...body }, scope(companyId)))
export const useResendInvitation = () => useInvitationMutation((id: string) => http.post<void>(`/company/invitations/${id}/resend`))
export const useRevokeInvitation = () => useInvitationMutation((id: string) => http.delete<void>(`/company/invitations/${id}`))

export interface AuditQuery { companyId?: string; action?: string; page?: number }

export const useAuditLogs = (query: AuditQuery) =>
  useQuery({
    queryKey: qk.auditLogs(query),
    queryFn: () => http.get<Paged<AuditLogEntry>>('/company/audit-logs', { ...query }),
    placeholderData: keepPreviousData,
  })
