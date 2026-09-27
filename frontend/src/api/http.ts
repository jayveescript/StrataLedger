import { tokenStore } from '@/auth/tokenStore'
import type { AuthResponse } from './types'

const BASE = '/api/v1'
export const CSRF_HEADER = 'X-StrataLedger-Csrf'

/** RFC 7807 problem returned by the API, with field errors for forms. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: Record<string, string[]>
  readonly feature?: string

  constructor(status: number, body: Partial<{ title: string; code: string; errors: Record<string, string[]>; feature: string }>) {
    super(body.title ?? `Request failed (${status})`)
    this.status = status
    this.code = body.code ?? 'unknown'
    this.fieldErrors = body.errors ?? {}
    this.feature = body.feature
  }

  get isFeatureLocked() {
    return this.status === 402
  }
}

type Json = Record<string, unknown> | unknown[]

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Json | FormData
  query?: Record<string, string | number | boolean | null | undefined>
  signal?: AbortSignal
  /** Skip the automatic refresh-and-retry on 401 (used by auth endpoints themselves). */
  skipRefresh?: boolean
}

let refreshInFlight: Promise<string | null> | null = null
let onSessionExpired: (() => void) | null = null

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

/** Single-flight: concurrent 401s share one refresh call so the rotating refresh token is only spent once. */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { [CSRF_HEADER]: '1' },
  })
    .then(async (res) => (res.ok ? ((await res.json()) as AuthResponse).accessToken : null))
    .catch(() => null)
    .then((token) => {
      tokenStore.set(token)
      return token
    })
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const params = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  const qs = params.toString()
  return `${BASE}${path}${qs ? `?${qs}` : ''}`
}

async function send(path: string, options: RequestOptions, token: string | null) {
  const isForm = options.body instanceof FormData
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body && !isForm) headers['Content-Type'] = 'application/json'

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    credentials: 'same-origin',
    signal: options.signal,
    body: options.body ? (isForm ? (options.body as FormData) : JSON.stringify(options.body)) : undefined,
  })
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options, tokenStore.get())

  if (response.status === 401 && !options.skipRefresh) {
    const token = await refreshAccessToken()
    if (!token) {
      onSessionExpired?.()
      throw new ApiError(401, { title: 'Your session has expired. Please sign in again.', code: 'auth.session_expired' })
    }
    response = await send(path, options, token)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(response.status, body)
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }

  const type = response.headers.get('content-type') ?? ''
  return (type.includes('json') ? await response.json() : await response.text()) as T
}

export const http = {
  get: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) => request<T>(path, { query, signal }),
  post: <T>(path: string, body?: Json | FormData, query?: RequestOptions['query']) => request<T>(path, { method: 'POST', body, query }),
  put: <T>(path: string, body?: Json, query?: RequestOptions['query']) => request<T>(path, { method: 'PUT', body, query }),
  delete: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'DELETE', query }),
}
