import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './rates'

function fredResponse(value: string, date = '2026-07-09') {
  return new Response(JSON.stringify({ observations: [{ date, value }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

const req = new Request('http://localhost/api/rates')

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('rates function', () => {
  it('returns both rates with a cache header', async () => {
    vi.stubEnv('FRED_API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) =>
        String(url).includes('MORTGAGE30US') ? fredResponse('6.72') : fredResponse('5.90'),
      ),
    )

    const res = await handler(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600')
    expect(await res.json()).toEqual({ rate30: 6.72, rate15: 5.9, asOf: '2026-07-09' })
  })

  it('sends the API key and requests the latest observation', async () => {
    vi.stubEnv('FRED_API_KEY', 'test-key')
    const fetchMock = vi.fn(async (_url: string | URL) => fredResponse('6.72'))
    vi.stubGlobal('fetch', fetchMock)

    await handler(req)
    const calledUrl = String(fetchMock.mock.calls[0]![0])
    expect(calledUrl).toContain('api_key=test-key')
    expect(calledUrl).toContain('sort_order=desc')
    expect(calledUrl).toContain('limit=1')
    expect(calledUrl).toContain('file_type=json')
  })

  it('returns a JSON 500 when the key is missing', async () => {
    vi.stubEnv('FRED_API_KEY', '')
    const res = await handler(req)
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/FRED_API_KEY/)
  })

  it('returns a JSON 502 when FRED errors', async () => {
    vi.stubEnv('FRED_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 403 })))

    const res = await handler(req)
    expect(res.status).toBe(502)
    expect((await res.json()).error).toMatch(/403/)
  })

  it('returns a JSON 502 when the observation is not numeric', async () => {
    vi.stubEnv('FRED_API_KEY', 'test-key')
    // FRED encodes missing weekly values as "."
    vi.stubGlobal('fetch', vi.fn(async () => fredResponse('.')))

    const res = await handler(req)
    expect(res.status).toBe(502)
  })
})
