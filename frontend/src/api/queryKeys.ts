/** Central query-key factory so invalidation stays consistent across pages. */
export const qk = {
  sessions: ['account', 'sessions'] as const,
  dashboard: ['dashboard'] as const,
  plans: (params?: object) => ['plans', params ?? {}] as const,
  plan: (id: string) => ['plans', 'detail', id] as const,
  owners: (params?: object) => ['owners', params ?? {}] as const,
  owner: (id: string) => ['owners', 'detail', id] as const,
  companyUsers: (params?: object) => ['company', 'users', params ?? {}] as const,
  invitations: (params?: object) => ['company', 'invitations', params ?? {}] as const,
  branding: (companyId?: string) => ['company', 'branding', companyId ?? 'self'] as const,
  usage: (companyId?: string) => ['company', 'usage', companyId ?? 'self'] as const,
  auditLogs: (params?: object) => ['company', 'audit', params ?? {}] as const,
  companies: (params?: object) => ['platform', 'companies', params ?? {}] as const,
  company: (id: string) => ['platform', 'companies', 'detail', id] as const,
  companyFeatures: (id: string) => ['platform', 'companies', id, 'features'] as const,
  tiers: ['platform', 'tiers'] as const,
  portal: ['portal'] as const,
}
