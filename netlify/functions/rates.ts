/**
 * FRED proxy — keeps the API key server-side and works around FRED's
 * lack of browser CORS. Returns the latest weekly national-average
 * mortgage rates: { rate30, rate15, asOf }.
 */

const FRED_URL = 'https://api.stlouisfed.org/fred/series/observations'

interface Observation {
  value: number
  date: string
}

async function latestObservation(seriesId: string, apiKey: string): Promise<Observation> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    sort_order: 'desc',
    limit: '1',
  })
  const res = await fetch(`${FRED_URL}?${params}`)
  if (!res.ok) {
    throw new Error(`FRED responded ${res.status} for ${seriesId}`)
  }
  const data: unknown = await res.json()
  const obs = (data as { observations?: Array<{ value?: string; date?: string }> })
    .observations?.[0]
  const value = Number(obs?.value)
  if (!obs?.date || !Number.isFinite(value)) {
    throw new Error(`No numeric observation returned for ${seriesId}`)
  }
  return { value, date: obs.date }
}

function json(status: number, body: object, cacheable = false): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Rates only change weekly; an hour of caching is plenty fresh
      'Cache-Control': cacheable ? 'public, max-age=3600' : 'no-store',
    },
  })
}

export default async function handler(_req: Request): Promise<Response> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    return json(500, { error: 'FRED_API_KEY is not configured' })
  }

  try {
    const [m30, m15] = await Promise.all([
      latestObservation('MORTGAGE30US', apiKey),
      latestObservation('MORTGAGE15US', apiKey),
    ])
    return json(200, { rate30: m30.value, rate15: m15.value, asOf: m30.date }, true)
  } catch (err) {
    return json(502, {
      error: err instanceof Error ? err.message : 'Failed to fetch rates from FRED',
    })
  }
}
