/** Central query-key factory so invalidation stays consistent across pages. */
export const qk = {
  sessions: ['account', 'sessions'] as const,
  items: (params?: object) => ['items', params ?? {}] as const,
  item: (id: string) => ['items', 'detail', id] as const,
  tenantUsers: (params?: object) => ['tenant', 'users', params ?? {}] as const,
  invitations: (params?: object) => ['tenant', 'invitations', params ?? {}] as const,
  branding: (tenantId?: string) => ['tenant', 'branding', tenantId ?? 'self'] as const,
  usage: (tenantId?: string) => ['tenant', 'usage', tenantId ?? 'self'] as const,
  auditLogs: (params?: object) => ['tenant', 'audit', params ?? {}] as const,
  tenants: (params?: object) => ['platform', 'tenants', params ?? {}] as const,
  tenant: (id: string) => ['platform', 'tenants', 'detail', id] as const,
  tenantFeatures: (id: string) => ['platform', 'tenants', id, 'features'] as const,
  tiers: ['platform', 'tiers'] as const,
}
