import DonutChart, { type DonutSegment } from './DonutChart'
import { LOAN_TYPES, type LoanType, type PaymentBreakdown } from '../lib/mortgage'
import { formatCurrency, formatNumber } from '../lib/format'

interface PaymentResultProps {
  breakdown: PaymentBreakdown
  loanAmount: number
  downPaymentDollars: number
  downPaymentPercent: number
  loanType: LoanType
}

export default function PaymentResult({
  breakdown,
  loanAmount,
  downPaymentDollars,
  downPaymentPercent,
  loanType,
}: PaymentResultProps) {
  const introYears = LOAN_TYPES[loanType].introYears
  const hasPayment = breakdown.total > 0

  const segments: DonutSegment[] = [
    {
      key: 'pi',
      label: 'Principal & Interest',
      value: breakdown.principalAndInterest,
      colorVar: '--chart-pi',
    },
    { key: 'taxes', label: 'Taxes', value: breakdown.taxes, colorVar: '--chart-taxes' },
    {
      key: 'insurance',
      label: 'Insurance',
      value: breakdown.insurance,
      colorVar: '--chart-insurance',
    },
  ]

  return (
    <div className="result">
      <div className="result__hero">
        <p className="result__hero-label">Total monthly payment</p>
        {/* key re-triggers the pop animation whenever the amount changes */}
        <p
          key={breakdown.total.toFixed(2)}
          className={`result__hero-value numeric${hasPayment ? '' : ' result__hero-value--empty'}`}
        >
          {formatCurrency(breakdown.total, { cents: true })}
        </p>
        {introYears !== null && hasPayment && (
          <p className="result__hero-note">for the first {introYears} years</p>
        )}
      </div>

      <div className="result__chart">
        <DonutChart
          segments={segments}
          ariaLabel={
            hasPayment
              ? `Monthly payment breakdown: principal and interest ${formatCurrency(breakdown.principalAndInterest, { cents: true })}, taxes ${formatCurrency(breakdown.taxes, { cents: true })}, insurance ${formatCurrency(breakdown.insurance, { cents: true })}`
              : 'Monthly payment breakdown (no amounts yet)'
          }
        />
        <ul className="legend">
          {segments.map((segment) => (
            <li key={segment.key} className="legend__row">
              <span
                className="legend__swatch"
                style={{ backgroundColor: `var(${segment.colorVar})` }}
                aria-hidden="true"
              />
              <span className="legend__label">{segment.label}</span>
              <span className="legend__value numeric">
                {formatCurrency(segment.value, { cents: true })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="result__stats">
        <div className="result__stat">
          <dt>Loan amount</dt>
          <dd className="numeric">{formatCurrency(loanAmount)}</dd>
        </div>
        <div className="result__stat">
          <dt>Down payment</dt>
          <dd className="numeric">
            {formatCurrency(downPaymentDollars)}
            {downPaymentDollars > 0 && downPaymentPercent > 0 && (
              <span className="result__stat-sub"> ({formatNumber(downPaymentPercent)}%)</span>
            )}
          </dd>
        </div>
        <div className="result__stat">
          <dt>Total interest over 30 yrs</dt>
          <dd className="numeric">{formatCurrency(breakdown.totalInterest)}</dd>
        </div>
      </dl>
    </div>
  )
}
