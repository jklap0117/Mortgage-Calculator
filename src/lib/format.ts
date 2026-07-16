/** Currency and numeric-input formatting helpers. */

const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const usdCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const plainNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatCurrency(value: number, opts?: { cents?: boolean }): string {
  if (!Number.isFinite(value)) return '—'
  return (opts?.cents ? usdCents : usdWhole).format(value)
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return ''
  return plainNumber.format(value)
}

/**
 * Parse a user-typed numeric string ("450,000", "$1,200.50") into a number.
 * Returns 0 for empty or unparseable input.
 */
export function parseNumeric(raw: string): number {
  const cleaned = raw.replace(/[$,%\s,]/g, '')
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return 0
  const n = Number(cleaned)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Keep only digits and at most one decimal point while the user types. */
export function sanitizeDecimalInput(raw: string): string {
  let out = raw.replace(/[^0-9.]/g, '')
  const firstDot = out.indexOf('.')
  if (firstDot !== -1) {
    out = out.slice(0, firstDot + 1) + out.slice(firstDot + 1).replace(/\./g, '')
  }
  return out
}
