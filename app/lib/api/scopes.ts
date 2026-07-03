export const ALL_SCOPES = [
  "read:plans",
  "read:owners",
  "read:levies",
  "read:expenses",
  "read:funds",
  "read:reports",
  "read:audit",
  "write:expenses",
  "write:payments",
] as const

export type Scope = (typeof ALL_SCOPES)[number]

export const READ_SCOPES: Scope[] = ALL_SCOPES.filter(s => s.startsWith("read:"))

export function isScope(value: string): value is Scope {
  return (ALL_SCOPES as readonly string[]).includes(value)
}
