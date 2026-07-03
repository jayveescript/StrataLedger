// Best-effort in-memory sliding-window rate limiter (per serverless instance).
// Protects the token endpoint from credential brute-forcing. For hard guarantees
// swap in a shared store (Upstash/Redis) — the interface stays the same.

const WINDOW_MS = 60_000
const buckets = new Map<string, number[]>()

export function checkRateLimit(key: string, maxPerWindow: number): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter(t => now - t < WINDOW_MS)

  if (hits.length >= maxPerWindow) {
    const oldest = hits[0]
    return { allowed: false, retryAfterSeconds: Math.ceil((oldest + WINDOW_MS - now) / 1000) }
  }

  hits.push(now)
  buckets.set(key, hits)

  // Opportunistic cleanup so the map doesn't grow unbounded
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every(t => now - t >= WINDOW_MS)) buckets.delete(k)
    }
  }

  return { allowed: true, retryAfterSeconds: 0 }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")
  return fwd?.split(",")[0]?.trim() || "unknown"
}
