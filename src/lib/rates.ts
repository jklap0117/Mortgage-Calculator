/** Client-side rates: /api/rates fetch + localStorage fallback cache. */

export interface RatesData {
  rate30: number
  rate15: number
  asOf: string
}

const STORAGE_KEY = 'mortgage-calculator:rates'
const CACHE_VERSION = 1

interface RatesCacheEnvelope {
  version: number
  data: RatesData
}

function isRatesData(value: unknown): value is RatesData {
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

export function loadCachedRates(storage: Pick<Storage, 'getItem'>): RatesData | null {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RatesCacheEnvelope>
    if (parsed.version !== CACHE_VERSION || !isRatesData(parsed.data)) return null
    return parsed.data
  } catch {
    return null
  }
}

export function saveCachedRates(storage: Pick<Storage, 'setItem'>, data: RatesData): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: CACHE_VERSION, data }))
  } catch {
    // Storage full or unavailable — the cache is best-effort
  }
}

export async function fetchRates(): Promise<RatesData> {
  const res = await fetch('/api/rates')
  if (!res.ok) throw new Error(`Rates request failed with ${res.status}`)
  const data: unknown = await res.json()
  if (!isRatesData(data)) throw new Error('Rates response was malformed')
  return data
}

/** "2026-07-10" → "July 10, 2026" without timezone drift. */
export function formatAsOfDate(asOf: string): string {
  const [y, m, d] = asOf.split('-').map(Number)
  if (!y || !m || !d) return asOf
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}
