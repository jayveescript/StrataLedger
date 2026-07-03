import { ALL_SCOPES, READ_SCOPES, type Scope } from "./scopes"

export interface OAuthClient {
  clientId: string
  clientSecret: string
  name: string
  scopes: Scope[]
}

// Production clients come from the OAUTH_CLIENTS env var (JSON array of OAuthClient).
// The demo clients below exist so the public demo works out of the box — they only
// ever expose static mock data. Rotate/replace via env in a real deployment.
const DEMO_CLIENTS: OAuthClient[] = [
  {
    clientId: "demo_readonly",
    clientSecret: "sl_demo_readonly_4f8a2b1c9d3e",
    name: "Demo — Read Only",
    scopes: [...READ_SCOPES],
  },
  {
    clientId: "demo_full_access",
    clientSecret: "sl_demo_full_7c1e5d9a3b2f",
    name: "Demo — Full Access",
    scopes: [...ALL_SCOPES],
  },
]

function loadClients(): OAuthClient[] {
  const raw = process.env.OAUTH_CLIENTS
  if (!raw) return DEMO_CLIENTS
  try {
    const parsed = JSON.parse(raw) as OAuthClient[]
    if (Array.isArray(parsed) && parsed.every(c => c.clientId && c.clientSecret)) {
      return parsed
    }
  } catch {
    // fall through to demo clients
  }
  console.warn("OAUTH_CLIENTS env var is set but invalid JSON — falling back to demo clients")
  return DEMO_CLIENTS
}

// Constant-time string comparison to prevent timing attacks on secrets.
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder()
  const bufA = encoder.encode(a)
  const bufB = encoder.encode(b)
  let diff = bufA.length ^ bufB.length
  const len = Math.max(bufA.length, bufB.length)
  for (let i = 0; i < len; i++) {
    diff |= (bufA[i % bufA.length] ?? 0) ^ (bufB[i % bufB.length] ?? 0)
  }
  return diff === 0
}

export function verifyClientCredentials(clientId: string, clientSecret: string): OAuthClient | null {
  const client = loadClients().find(c => c.clientId === clientId)
  if (!client) {
    // Still burn a comparison so unknown vs known client ids are timing-identical
    timingSafeEqual(clientSecret, "sl_dummy_secret_for_constant_time")
    return null
  }
  return timingSafeEqual(clientSecret, client.clientSecret) ? client : null
}
