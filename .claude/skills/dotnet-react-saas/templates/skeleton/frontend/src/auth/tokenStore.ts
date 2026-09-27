/**
 * Access token lives only in memory (never localStorage) so injected scripts cannot read it from storage; the
 * refresh token is an HttpOnly cookie the JS can't see at all. A page reload silently re-hydrates via /auth/refresh.
 */
type Listener = (token: string | null) => void

let accessToken: string | null = null
const listeners = new Set<Listener>()

export const tokenStore = {
  get: () => accessToken,
  set(token: string | null) {
    accessToken = token
    listeners.forEach((listener) => listener(token))
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
