import type { NextRequest } from "next/server"
import { verifyClientCredentials } from "@/lib/api/clients"
import { issueAccessToken, TOKEN_TTL_SECONDS } from "@/lib/api/auth"
import { apiError, apiJson, corsPreflight } from "@/lib/api/respond"
import { checkRateLimit, clientIp } from "@/lib/api/rate-limit"
import { isScope, type Scope } from "@/lib/api/scopes"

// OAuth 2.0 token endpoint — client_credentials grant (RFC 6749 §4.4).
// Client authentication: HTTP Basic (preferred, §2.3.1) or body parameters.
// Accepts application/x-www-form-urlencoded (spec) and application/json (convenience).

interface TokenParams {
  grantType?: string
  clientId?: string
  clientSecret?: string
  scope?: string
}

async function parseParams(req: NextRequest): Promise<TokenParams | null> {
  const contentType = req.headers.get("content-type") ?? ""
  let body: Record<string, string> = {}

  try {
    if (contentType.includes("application/json")) {
      body = (await req.json()) as Record<string, string>
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = Object.fromEntries(new URLSearchParams(await req.text()))
    } else if (contentType) {
      return null
    }
  } catch {
    return null
  }

  const params: TokenParams = {
    grantType: body.grant_type,
    clientId: body.client_id,
    clientSecret: body.client_secret,
    scope: body.scope,
  }

  // HTTP Basic client authentication takes precedence over body credentials
  const authHeader = req.headers.get("authorization")
  if (authHeader?.toLowerCase().startsWith("basic ")) {
    try {
      const decoded = atob(authHeader.slice(6))
      const sep = decoded.indexOf(":")
      if (sep > 0) {
        params.clientId = decodeURIComponent(decoded.slice(0, sep))
        params.clientSecret = decodeURIComponent(decoded.slice(sep + 1))
      }
    } catch {
      return null
    }
  }

  return params
}

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(`token:${clientIp(req)}`, 10)
  if (!rate.allowed) {
    return apiError(429, "slow_down", "Too many token requests — try again shortly", {
      "Retry-After": String(rate.retryAfterSeconds),
    })
  }

  const params = await parseParams(req)
  if (!params) {
    return apiError(400, "invalid_request", "Malformed request body or Authorization header")
  }

  if (params.grantType !== "client_credentials") {
    return apiError(400, "unsupported_grant_type", 'Only the "client_credentials" grant type is supported')
  }

  if (!params.clientId || !params.clientSecret) {
    return apiError(400, "invalid_request", "Client credentials are required (HTTP Basic or client_id/client_secret body parameters)")
  }

  const client = verifyClientCredentials(params.clientId, params.clientSecret)
  if (!client) {
    return apiError(401, "invalid_client", "Client authentication failed", {
      "WWW-Authenticate": 'Basic realm="strataledger"',
    })
  }

  // Requested scopes must be a subset of the client's registered scopes
  let grantedScopes: Scope[] = client.scopes
  if (params.scope) {
    const requested = params.scope.split(" ").filter(Boolean)
    const invalid = requested.filter(s => !isScope(s) || !client.scopes.includes(s as Scope))
    if (invalid.length > 0) {
      return apiError(400, "invalid_scope", `Scope(s) not available to this client: ${invalid.join(", ")}`)
    }
    grantedScopes = requested as Scope[]
  }

  const accessToken = await issueAccessToken(client.clientId, grantedScopes)

  return apiJson(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: TOKEN_TTL_SECONDS,
      scope: grantedScopes.join(" "),
    },
    { headers: { Pragma: "no-cache" } }
  )
}

export function OPTIONS() {
  return corsPreflight()
}
