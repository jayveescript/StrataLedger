import { tokenStore } from '@/auth/tokenStore'
import { ApiError, http } from './http'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('http client', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    tokenStore.set(null)
  })

  it('attaches the in-memory bearer token', async () => {
    tokenStore.set('abc')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { ok: true }))
    await http.get('/x')
    const headers = fetchMock.mock.calls[0]![1]!.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer abc')
  })

  it('refreshes once for concurrent 401s and retries with the new token', async () => {
    tokenStore.set('expired')
    let refreshCalls = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/refresh')) {
        refreshCalls++
        return json(200, { step: 'Completed', accessToken: 'fresh', accessTokenExpiresAt: null, mfaToken: null })
      }
      const auth = (init!.headers as Record<string, string>).Authorization
      return auth === 'Bearer fresh' ? json(200, { url }) : json(401, { title: 'expired' })
    })

    const results = await Promise.all([http.get<{ url: string }>('/a'), http.get<{ url: string }>('/b')])
    expect(results.map((r) => r.url)).toEqual(['/api/v1/a', '/api/v1/b'])
    expect(refreshCalls).toBe(1)
    expect(tokenStore.get()).toBe('fresh')
  })

  it('surfaces problem details as ApiError with field errors and 402 feature lock', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(402, { title: 'Upgrade', code: 'feature.disabled', feature: 'Reports' }))
    const error = await http.get('/r').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).isFeatureLocked).toBe(true)
    expect((error as ApiError).feature).toBe('Reports')
  })
})
