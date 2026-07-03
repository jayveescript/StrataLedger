import { SignJWT, jwtVerify } from "jose"
import type { NextRequest } from "next/server"
import { apiError } from "./respond"
import type { Scope } from "./scopes"

const ISSUER = "strataledger"
const AUDIENCE = "strataledger-api"
export const TOKEN_TTL_SECONDS = 3600

function getSigningKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("AUTH_SECRET is not set — using an insecure built-in key. Set AUTH_SECRET in your Vercel project settings.")
    }
    return new TextEncoder().encode("insecure-dev-secret-set-AUTH_SECRET-in-production")
  }
  return new TextEncoder().encode(secret)
}

export async function issueAccessToken(clientId: string, scopes: Scope[]): Promise<string> {
  return new SignJWT({ scope: scopes.join(" ") })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(clientId)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getSigningKey())
}

export interface AuthContext {
  clientId: string
  scopes: string[]
}

type AuthResult =
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: Response }

function unauthorized(description?: string): Response {
  const challenge = description
    ? `Bearer realm="strataledger", error="invalid_token", error_description="${description}"`
    : `Bearer realm="strataledger"`
  return apiError(401, "invalid_token", description ?? "Missing or invalid access token", {
    "WWW-Authenticate": challenge,
  })
}

function forbidden(requiredScope: Scope): Response {
  return apiError(403, "insufficient_scope", `This endpoint requires the "${requiredScope}" scope`, {
    "WWW-Authenticate": `Bearer realm="strataledger", error="insufficient_scope", scope="${requiredScope}"`,
  })
}

export async function authenticate(req: NextRequest, requiredScope: Scope): Promise<AuthResult> {
  const header = req.headers.get("authorization")
  if (!header) return { ok: false, response: unauthorized() }

  const [scheme, token] = header.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return { ok: false, response: unauthorized("Authorization header must use the Bearer scheme") }
  }

  let payload
  try {
    const verified = await jwtVerify(token, getSigningKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    payload = verified.payload
  } catch {
    return { ok: false, response: unauthorized("The access token is expired or invalid") }
  }

  const scopes = typeof payload.scope === "string" ? payload.scope.split(" ") : []
  if (!scopes.includes(requiredScope)) {
    return { ok: false, response: forbidden(requiredScope) }
  }

  return { ok: true, ctx: { clientId: payload.sub ?? "unknown", scopes } }
}

// Wraps a route handler with bearer-token auth + scope enforcement.
export function protectedRoute(
  requiredScope: Scope,
  handler: (req: NextRequest, ctx: AuthContext) => Response | Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    const auth = await authenticate(req, requiredScope)
    if (!auth.ok) return auth.response
    return handler(req, auth.ctx)
  }
}
