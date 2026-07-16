import { describe, expect, it } from 'vitest'
import {
  autoLoanAmount,
  downPaymentDollars,
  downPaymentPercent,
  monthlyPrincipalAndInterest,
  paymentBreakdown,
  totalInterest,
  TERM_MONTHS,
} from './mortgage'

describe('monthlyPrincipalAndInterest', () => {
  it('matches the known-good case: $400k at 6.5% over 30 years ≈ $2,528.27', () => {
    expect(monthlyPrincipalAndInterest(400_000, 6.5, 360)).toBeCloseTo(2528.27, 2)
  })

  it('handles the 0% edge case as straight principal division', () => {
    expect(monthlyPrincipalAndInterest(360_000, 0, 360)).toBeCloseTo(1000, 10)
  })

  it('defaults to a 30-year term', () => {
    expect(monthlyPrincipalAndInterest(400_000, 6.5)).toBeCloseTo(
      monthlyPrincipalAndInterest(400_000, 6.5, TERM_MONTHS),
      10,
    )
  })

  it('matches other independently verified values', () => {
    // $300k at 7% / 30yr → $1,995.91; $250k at 5.5% / 15yr → $2,042.71
    expect(monthlyPrincipalAndInterest(300_000, 7, 360)).toBeCloseTo(1995.91, 2)
    expect(monthlyPrincipalAndInterest(250_000, 5.5, 180)).toBeCloseTo(2042.71, 2)
  })

  it('returns 0 for a non-positive principal or term', () => {
    expect(monthlyPrincipalAndInterest(0, 6.5, 360)).toBe(0)
    expect(monthlyPrincipalAndInterest(-100, 6.5, 360)).toBe(0)
    expect(monthlyPrincipalAndInterest(100_000, 6.5, 0)).toBe(0)
  })
})

describe('totalInterest', () => {
  it('computes lifetime interest for the known case', () => {
    // 360 × 2528.27… − 400,000 ≈ $510,177.86
    expect(totalInterest(400_000, 6.5, 360)).toBeCloseTo(510_177.86, 0)
  })

  it('is zero at 0% interest', () => {
    expect(totalInterest(360_000, 0, 360)).toBeCloseTo(0, 8)
  })

  it('is zero for a non-positive principal', () => {
    expect(totalInterest(0, 6.5, 360)).toBe(0)
  })
})

describe('paymentBreakdown', () => {
  it('sums P&I, taxes, and insurance into the total', () => {
    const b = paymentBreakdown(400_000, 6.5, 450, 120)
    expect(b.principalAndInterest).toBeCloseTo(2528.27, 2)
    expect(b.taxes).toBe(450)
    expect(b.insurance).toBe(120)
    expect(b.total).toBeCloseTo(2528.27 + 450 + 120, 2)
    expect(b.totalInterest).toBeCloseTo(510_177.86, 0)
  })

  it('treats negative or NaN extras as zero', () => {
    const b = paymentBreakdown(400_000, 6.5, -50, Number.NaN)
    expect(b.taxes).toBe(0)
    expect(b.insurance).toBe(0)
    expect(b.total).toBeCloseTo(b.principalAndInterest, 10)
  })
})

describe('down payment conversions', () => {
  it('converts % mode to dollars', () => {
    expect(downPaymentDollars(500_000, '%', 20)).toBe(100_000)
  })

  it('passes $ mode through', () => {
    expect(downPaymentDollars(500_000, '$', 80_000)).toBe(80_000)
  })

  it('converts $ mode to percent', () => {
    expect(downPaymentPercent(500_000, '$', 100_000)).toBe(20)
  })

  it('passes % mode through', () => {
    expect(downPaymentPercent(500_000, '%', 12.5)).toBe(12.5)
  })

  it('handles zero price and non-finite values without NaN', () => {
    expect(downPaymentPercent(0, '$', 50_000)).toBe(0)
    expect(downPaymentDollars(500_000, '%', Number.NaN)).toBe(0)
    expect(downPaymentPercent(500_000, '$', Number.NaN)).toBe(0)
  })
})

describe('autoLoanAmount', () => {
  it('is price minus down payment', () => {
    expect(autoLoanAmount(500_000, 100_000)).toBe(400_000)
  })

  it('never goes negative', () => {
    expect(autoLoanAmount(300_000, 400_000)).toBe(0)
  })
})
