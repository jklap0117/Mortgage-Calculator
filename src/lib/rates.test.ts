import { describe, expect, it } from 'vitest'
import { formatAsOfDate, loadCachedRates, saveCachedRates, type RatesData } from './rates'

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    dump: () => Object.fromEntries(store),
  }
}

const sample: RatesData = { rate30: 6.72, rate15: 5.9, asOf: '2026-07-09' }

describe('rates cache', () => {
  it('round-trips through storage', () => {
    const storage = fakeStorage()
    saveCachedRates(storage, sample)
    expect(loadCachedRates(storage)).toEqual(sample)
  })

  it('returns null when nothing is cached', () => {
    expect(loadCachedRates(fakeStorage())).toBeNull()
  })

  it('tolerates corrupt JSON', () => {
    const storage = fakeStorage({ 'mortgage-calculator:rates': '{not json' })
    expect(loadCachedRates(storage)).toBeNull()
  })

  it('rejects wrong version or malformed payloads', () => {
    const wrongVersion = fakeStorage({
      'mortgage-calculator:rates': JSON.stringify({ version: 99, data: sample }),
    })
    expect(loadCachedRates(wrongVersion)).toBeNull()

    const badData = fakeStorage({
      'mortgage-calculator:rates': JSON.stringify({
        version: 1,
        data: { rate30: 'high', rate15: 5.9, asOf: '2026-07-09' },
      }),
    })
    expect(loadCachedRates(badData)).toBeNull()
  })
})

describe('formatAsOfDate', () => {
  it('formats an ISO date without timezone drift', () => {
    expect(formatAsOfDate('2026-07-09')).toBe('July 9, 2026')
  })

  it('passes through unparseable strings', () => {
    expect(formatAsOfDate('last week')).toBe('last week')
  })
})
