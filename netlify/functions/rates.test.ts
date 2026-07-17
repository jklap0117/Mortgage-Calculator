import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Context } from '@netlify/functions'
import handler from './rates'

const req = new Request('http://localhost/api/rates')
const context = {} as Context

function fredResponse(date: string, value: string) {
  return new Response(JSON.stringify({ observations: [{ date, value }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('rates function', () => {
  beforeEach(() => {
    process.env.FRED_API_KEY = 'test-key'
  })

  afterEach(() => {
    delete process.env.FRED_API_KEY
    vi.unstubAllGlobals()
  })

  it('returns both rates with the observation date and cache header', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const u = new URL(String(url))
      expect(u.searchParams.get('api_key')).toBe('test-key')
      expect(u.searchParams.get('file_type')).toBe('json')
      expect(u.searchParams.get('sort_order')).toBe('desc')
      expect(u.searchParams.get('limit')).toBe('1')
      return u.searchParams.get('series_id') === 'MORTGAGE30US'
        ? fredResponse('2026-07-09', '6.72')
        : fredResponse('2026-07-09', '5.86')
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await handler(req, context)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600')
    expect(await res.json()).toEqual({ rate30: 6.72, rate15: 5.86, asOf: '2026-07-09' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns a 500 JSON error when FRED_API_KEY is missing', async () => {
    delete process.env.FRED_API_KEY
    const res = await handler(req, context)
    expect(res.status).toBe(500)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(await res.json()).toEqual({ error: 'FRED_API_KEY is not configured' })
  })

  it('returns a 502 JSON error when FRED responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 403 })))
    const res = await handler(req, context)
    expect(res.status).toBe(502)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('403')
  })

  it('returns a 502 JSON error when the observation value is missing (".")', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fredResponse('2026-07-09', '.')),
    )
    const res = await handler(req, context)
    expect(res.status).toBe(502)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('No usable observation')
  })
})
