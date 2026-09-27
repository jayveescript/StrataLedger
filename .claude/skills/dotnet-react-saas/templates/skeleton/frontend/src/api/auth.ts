import { request } from './http'
import type { AuthResponse, InvitationPreview, Me, MfaConfirmResponse, MfaSetup } from './types'

const post = <T>(path: string, body?: Record<string, unknown>) =>
  request<T>(`/auth${path}`, { method: 'POST', body, skipRefresh: true })

export const authApi = {
  login: (email: string, password: string) => post<AuthResponse>('/login', { email, password }),
  verifyMfa: (mfaToken: string, code: string, isRecoveryCode = false) =>
    post<AuthResponse>('/mfa/verify', { mfaToken, code, isRecoveryCode }),
  beginMfaSetup: (mfaToken: string | null) => request<MfaSetup>('/auth/mfa/setup', { method: 'POST', body: { mfaToken } }),
  confirmMfaSetup: (mfaToken: string | null, code: string) =>
    request<MfaConfirmResponse>('/auth/mfa/confirm', { method: 'POST', body: { mfaToken, code } }),
  logout: () => post<void>('/logout'),
  forgotPassword: (email: string) => post<void>('/password/forgot', { email }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    post<void>('/password/reset', { email, token, newPassword }),
  getInvitation: (token: string) => request<InvitationPreview>(`/auth/invitations/${encodeURIComponent(token)}`, { skipRefresh: true }),
  acceptInvitation: (token: string, firstName: string, lastName: string, password: string) =>
    post<AuthResponse>('/invitations/accept', { token, firstName, lastName, password }),
  me: () => request<Me>('/auth/me'),
}
