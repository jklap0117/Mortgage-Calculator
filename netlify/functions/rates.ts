import type { Context } from '@netlify/functions'

const FRED_OBSERVATIONS_URL = 'https://api.stlouisfed.org/fred/series/observations'

interface FredObservation {
  date: string
  value: string
}

interface FredObservationsResponse {
  observations?: FredObservation[]
}

export interface RatesPayload {
  rate30: number
  rate15: number
  asOf: string
}

/** Fetch the most recent observation for a FRED series. */
async function fetchLatestObservation(
  seriesId: string,
  apiKey: string,
): Promise<{ rate: number; date: string }> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    sort_order: 'desc',
    limit: '1',
  })
  const res = await fetch(`${FRED_OBSERVATIONS_URL}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`FRED responded with status ${res.status} for ${seriesId}`)
  }
  const data = (await res.json()) as FredObservationsResponse
  const latest = data.observations?.[0]
  // FRED reports missing data points as value: "."
  const rate = latest ? Number(latest.value) : NaN
  if (!latest || !Number.isFinite(rate)) {
    throw new Error(`No usable observation returned for ${seriesId}`)
  }
  return { rate, date: latest.date }
}

function jsonResponse(body: unknown, status: number, cacheControl: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
    },
  })
}

export default async function handler(_req: Request, _context: Context): Promise<Response> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    return jsonResponse({ error: 'FRED_API_KEY is not configured' }, 500, 'no-store')
  }

  try {
    const [thirty, fifteen] = await Promise.all([
      fetchLatestObservation('MORTGAGE30US', apiKey),
      fetchLatestObservation('MORTGAGE15US', apiKey),
    ])
    const payload: RatesPayload = {
      rate30: thirty.rate,
      rate15: fifteen.rate,
      asOf: thirty.date,
    }
    return jsonResponse(payload, 200, 'public, max-age=3600')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch rates'
    return jsonResponse({ error: message }, 502, 'no-store')
  }
}
