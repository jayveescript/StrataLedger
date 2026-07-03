// Shared response helpers: JSON with security + CORS headers, RFC-style errors,
// and a CORS preflight handler for cross-origin API consumers.

const BASE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  // Bearer-token APIs are safe to open cross-origin: no cookies are involved.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
}

export function apiJson(data: unknown, init?: { status?: number; headers?: Record<string, string> }): Response {
  return Response.json(data, {
    status: init?.status ?? 200,
    headers: { ...BASE_HEADERS, ...init?.headers },
  })
}

export function apiError(
  status: number,
  error: string,
  description: string,
  headers?: Record<string, string>
): Response {
  return apiJson({ error, error_description: description }, { status, headers })
}

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: BASE_HEADERS })
}
