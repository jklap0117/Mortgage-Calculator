/**
 * Pure mortgage math — no React, no DOM.
 *
 * Monthly P&I: M = P · [r(1+r)^n] / [(1+r)^n − 1]
 * where P = principal, r = monthly rate (annual / 12 / 100), n = payments.
 * When r = 0 the formula degenerates to M = P / n.
 */

export type LoanType = '30fixed' | 'arm7' | 'arm10'

export interface LoanTypeInfo {
  label: string
  /** All loan types amortize over 30 years. */
  termMonths: number
  /** For ARMs, the fixed intro period the shown payment applies to. */
  introYears: number | null
}

export const TERM_MONTHS = 360

export const LOAN_TYPES: Record<LoanType, LoanTypeInfo> = {
  '30fixed': { label: '30-yr Fixed', termMonths: TERM_MONTHS, introYears: null },
  arm7: { label: '7-yr ARM', termMonths: TERM_MONTHS, introYears: 7 },
  arm10: { label: '10-yr ARM', termMonths: TERM_MONTHS, introYears: 10 },
}

/**
 * Monthly principal & interest payment.
 * @param principal loan amount in dollars
 * @param annualRatePct annual interest rate as a percentage (e.g. 6.5)
 * @param termMonths total number of monthly payments (default 360)
 */
export function monthlyPrincipalAndInterest(
  principal: number,
  annualRatePct: number,
  termMonths: number = TERM_MONTHS,
): number {
  if (principal <= 0 || termMonths <= 0 || !Number.isFinite(principal)) return 0
  const r = annualRatePct / 12 / 100
  if (r === 0) return principal / termMonths
  const growth = Math.pow(1 + r, termMonths)
  return (principal * r * growth) / (growth - 1)
}

/** Total interest paid over the full term. */
export function totalInterest(
  principal: number,
  annualRatePct: number,
  termMonths: number = TERM_MONTHS,
): number {
  if (principal <= 0 || termMonths <= 0) return 0
  return monthlyPrincipalAndInterest(principal, annualRatePct, termMonths) * termMonths - principal
}

export interface PaymentBreakdown {
  principalAndInterest: number
  taxes: number
  insurance: number
  total: number
  totalInterest: number
}

/** Full monthly payment breakdown (PITI) plus lifetime interest. */
export function paymentBreakdown(
  principal: number,
  annualRatePct: number,
  monthlyTaxes: number,
  monthlyInsurance: number,
  termMonths: number = TERM_MONTHS,
): PaymentBreakdown {
  const pi = monthlyPrincipalAndInterest(principal, annualRatePct, termMonths)
  const taxes = Math.max(0, monthlyTaxes) || 0
  const insurance = Math.max(0, monthlyInsurance) || 0
  return {
    principalAndInterest: pi,
    taxes,
    insurance,
    total: pi + taxes + insurance,
    totalInterest: totalInterest(principal, annualRatePct, termMonths),
  }
}

/** Down payment in dollars from either entry mode. */
export function downPaymentDollars(
  purchasePrice: number,
  mode: '%' | '$',
  value: number,
): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return mode === '$' ? value : (purchasePrice * value) / 100
}

/** Down payment as a percentage of purchase price from either entry mode. */
export function downPaymentPercent(
  purchasePrice: number,
  mode: '%' | '$',
  value: number,
): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (mode === '%') return value
  return purchasePrice > 0 ? (value / purchasePrice) * 100 : 0
}

/** Loan amount implied by price and down payment (never negative). */
export function autoLoanAmount(purchasePrice: number, downPayment: number): number {
  return Math.max(0, purchasePrice - downPayment)
}
