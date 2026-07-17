/** Live mortgage rates: /api/rates fetch + localStorage offline cache. */

export interface Rates {
  rate30: number
  rate15: number
  /** ISO date (YYYY-MM-DD) of the FRED observation. */
  asOf: string
}

const CACHE_KEY = 'mortgage-calculator:rates:v1'

function isRates(value: unknown): value is Rates {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.rate30 === 'number' &&
    Number.isFinite(v.rate30) &&
    typeof v.rate15 === 'number' &&
    Number.isFinite(v.rate15) &&
    typeof v.asOf === 'string' &&
    v.asOf.length > 0
  )
}

export async function fetchRates(): Promise<Rates> {
  const res = await fetch('/api/rates')
  if (!res.ok) {
    throw new Error(`Rates request failed with status ${res.status}`)
  }
  const data: unknown = await res.json()
  if (!isRates(data)) {
    throw new Error('Rates response was malformed')
  }
  return data
}

export function readCachedRates(): Rates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isRates(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeCachedRates(rates: Rates): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates))
  } catch {
    // Storage may be unavailable (private mode, quota) — caching is best-effort.
  }
}

/** Format a YYYY-MM-DD observation date without timezone drift. */
export function formatObservationDate(asOf: string): string {
  const [year, month, day] = asOf.split('-').map(Number)
  if (!year || !month || !day) return asOf
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}
