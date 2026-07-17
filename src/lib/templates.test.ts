import { describe, expect, it } from 'vitest'
import {
  createTemplate,
  deleteTemplate,
  loadTemplates,
  renameTemplate,
  sameValues,
  saveTemplates,
  templateSummary,
  updateTemplateValues,
  type ScenarioTemplate,
  type ScenarioValues,
} from './templates'

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    dump: () => Object.fromEntries(store),
  }
}

const KEY = 'mortgage-calculator:templates'

const values: ScenarioValues = {
  purchasePrice: '450000',
  downPaymentMode: '%',
  downPaymentValue: '20',
  loanAmountOverride: null,
  rate: '6.5',
  loanType: '30fixed',
  monthlyTaxes: '400',
  monthlyInsurance: '120',
}

function sampleTemplate(overrides: Partial<ScenarioTemplate> = {}): ScenarioTemplate {
  return {
    ...values,
    id: 'abc-123',
    name: 'Blue house',
    createdAt: '2026-07-17T12:00:00.000Z',
    ...overrides,
  }
}

describe('template storage', () => {
  it('round-trips through storage', () => {
    const storage = fakeStorage()
    const list = [sampleTemplate(), sampleTemplate({ id: 'def-456', name: 'ARM option' })]
    saveTemplates(storage, list)
    expect(loadTemplates(storage)).toEqual(list)
  })

  it('returns an empty list when nothing is stored', () => {
    expect(loadTemplates(fakeStorage())).toEqual([])
  })

  it('tolerates corrupt JSON', () => {
    const storage = fakeStorage({ [KEY]: '{not json' })
    expect(loadTemplates(storage)).toEqual([])
  })

  it('rejects wrong version or malformed envelopes', () => {
    const wrongVersion = fakeStorage({
      [KEY]: JSON.stringify({ version: 99, templates: [sampleTemplate()] }),
    })
    expect(loadTemplates(wrongVersion)).toEqual([])

    const notArray = fakeStorage({
      [KEY]: JSON.stringify({ version: 1, templates: 'nope' }),
    })
    expect(loadTemplates(notArray)).toEqual([])
  })

  it('filters malformed items while keeping valid ones', () => {
    const good = sampleTemplate()
    const storage = fakeStorage({
      [KEY]: JSON.stringify({
        version: 1,
        templates: [
          good,
          null,
          'junk',
          { ...good, id: 'bad-loan-type', loanType: '40fixed' },
          { ...good, id: '', name: 'missing id' },
          { ...good, id: 'bad-price', purchasePrice: 450000 },
        ],
      }),
    })
    expect(loadTemplates(storage)).toEqual([good])
  })

  it('accepts a null loan amount override and a string one', () => {
    const auto = sampleTemplate({ id: 'auto', loanAmountOverride: null })
    const manual = sampleTemplate({ id: 'manual', loanAmountOverride: '350000' })
    const storage = fakeStorage()
    saveTemplates(storage, [auto, manual])
    expect(loadTemplates(storage)).toEqual([auto, manual])
  })

  it('swallows storage write failures', () => {
    const throwing = {
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }
    expect(() => saveTemplates(throwing, [sampleTemplate()])).not.toThrow()
  })
})

describe('createTemplate', () => {
  it('assigns unique ids, an ISO timestamp, and trims the name', () => {
    const a = createTemplate('  Blue house  ', values)
    const b = createTemplate('Blue house', values)
    expect(a.id).not.toBe(b.id)
    expect(a.name).toBe('Blue house')
    expect(Number.isNaN(Date.parse(a.createdAt))).toBe(false)
    expect(a.purchasePrice).toBe(values.purchasePrice)
  })
})

describe('list operations', () => {
  const list = [sampleTemplate(), sampleTemplate({ id: 'def-456', name: 'ARM option' })]

  it('renames only the matching template, immutably', () => {
    const next = renameTemplate(list, 'def-456', '  Beach condo ')
    expect(next).not.toBe(list)
    expect(next[0].name).toBe('Blue house')
    expect(next[1].name).toBe('Beach condo')
    expect(list[1].name).toBe('ARM option')
  })

  it('deletes only the matching template', () => {
    const next = deleteTemplate(list, 'abc-123')
    expect(next).toHaveLength(1)
    expect(next[0].id).toBe('def-456')
  })

  it('updates values while preserving id, name, and createdAt', () => {
    const edited: ScenarioValues = { ...values, rate: '5.9', loanAmountOverride: '300000' }
    const next = updateTemplateValues(list, 'abc-123', edited)
    expect(next[0].rate).toBe('5.9')
    expect(next[0].loanAmountOverride).toBe('300000')
    expect(next[0].id).toBe('abc-123')
    expect(next[0].name).toBe('Blue house')
    expect(next[0].createdAt).toBe('2026-07-17T12:00:00.000Z')
    expect(list[0].rate).toBe('6.5')
  })

  it('is a no-op for an unknown id', () => {
    expect(renameTemplate(list, 'nope', 'x')).toEqual(list)
    expect(deleteTemplate(list, 'nope')).toEqual(list)
    expect(updateTemplateValues(list, 'nope', values)).toEqual(list)
  })
})

describe('sameValues', () => {
  it('matches identical values', () => {
    expect(sameValues(values, { ...values })).toBe(true)
  })

  it('detects any single-field change', () => {
    expect(sameValues(values, { ...values, rate: '7' })).toBe(false)
    expect(sameValues(values, { ...values, downPaymentMode: '$' })).toBe(false)
    expect(sameValues(values, { ...values, loanAmountOverride: '360000' })).toBe(false)
  })
})

describe('templateSummary', () => {
  it('includes price, loan type label, and monthly payment', () => {
    // $450k − 20% down = $360k @ 6.5% → P&I ≈ $2,275.44; +$400 +$120 ≈ $2,795
    const summary = templateSummary(sampleTemplate())
    expect(summary).toContain('$450,000')
    expect(summary).toContain('30-yr Fixed')
    expect(summary).toContain('$2,795/mo')
  })

  it('uses the loan amount override when present', () => {
    const summary = templateSummary(
      sampleTemplate({ loanAmountOverride: '400000', loanType: 'arm7' }),
    )
    // $400k @ 6.5% → P&I ≈ $2,528.27; +$400 +$120 ≈ $3,048
    expect(summary).toContain('7-yr ARM')
    expect(summary).toContain('$3,048/mo')
  })
})
