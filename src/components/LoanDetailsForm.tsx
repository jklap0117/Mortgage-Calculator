import NumberField from './NumberField'
import SegmentedControl from './SegmentedControl'
import { LOAN_TYPES, type LoanType } from '../lib/mortgage'
import { formatCurrency, formatNumber, parseNumeric } from '../lib/format'

export type DownPaymentMode = '%' | '$'

const LOAN_TYPE_OPTIONS = (Object.keys(LOAN_TYPES) as LoanType[]).map((value) => ({
  value,
  label: LOAN_TYPES[value].label,
}))

interface LoanDetailsFormProps {
  price: string
  onPriceChange: (v: string) => void
  downPaymentMode: DownPaymentMode
  onDownPaymentModeChange: (mode: DownPaymentMode) => void
  downPaymentValue: string
  onDownPaymentValueChange: (v: string) => void
  /** The equivalent of the down payment in the *other* unit, for the live hint. */
  downPaymentDollarsValue: number
  downPaymentPercentValue: number
  loanAmountText: string
  onLoanAmountChange: (v: string) => void
  loanAmountOverridden: boolean
  onResetLoanAmount: () => void
  rate: string
  onRateChange: (v: string) => void
  loanType: LoanType
  onLoanTypeChange: (t: LoanType) => void
  taxes: string
  onTaxesChange: (v: string) => void
  insurance: string
  onInsuranceChange: (v: string) => void
}

export default function LoanDetailsForm(props: LoanDetailsFormProps) {
  const hasPrice = parseNumeric(props.price) > 0
  const hasDownPayment = parseNumeric(props.downPaymentValue) > 0

  const downPaymentHint = !hasDownPayment
    ? undefined
    : props.downPaymentMode === '%'
      ? hasPrice
        ? `= ${formatCurrency(props.downPaymentDollarsValue)}`
        : 'Enter a purchase price to see the dollar amount'
      : hasPrice
        ? `= ${formatNumber(props.downPaymentPercentValue)}% of the purchase price`
        : undefined

  return (
    <form className="loan-form" onSubmit={(e) => e.preventDefault()}>
      <NumberField
        label="Purchase price"
        prefix="$"
        placeholder="450,000"
        value={props.price}
        onChange={props.onPriceChange}
      />

      <NumberField
        label="Down payment"
        prefix={props.downPaymentMode === '$' ? '$' : undefined}
        suffix={props.downPaymentMode === '%' ? '%' : undefined}
        placeholder={props.downPaymentMode === '%' ? '20' : '90,000'}
        value={props.downPaymentValue}
        onChange={props.onDownPaymentValueChange}
        hint={downPaymentHint}
        labelAction={
          <SegmentedControl
            size="sm"
            ariaLabel="Down payment entry mode"
            options={[
              { value: '%', label: '%' },
              { value: '$', label: '$' },
            ]}
            value={props.downPaymentMode}
            onChange={props.onDownPaymentModeChange}
          />
        }
      />

      <NumberField
        label="Loan amount"
        prefix="$"
        placeholder="360,000"
        value={props.loanAmountText}
        onChange={props.onLoanAmountChange}
        hint={
          props.loanAmountOverridden
            ? 'Manually set'
            : 'Auto: price − down payment'
        }
        labelAction={
          props.loanAmountOverridden ? (
            <button
              type="button"
              className="link-button"
              onClick={props.onResetLoanAmount}
            >
              Reset to auto
            </button>
          ) : undefined
        }
      />

      <div className="field">
        <div className="field__label-row">
          <span className="field__label">Loan type</span>
        </div>
        <SegmentedControl
          ariaLabel="Loan type"
          options={LOAN_TYPE_OPTIONS}
          value={props.loanType}
          onChange={props.onLoanTypeChange}
        />
        <p className="field__hint">
          {props.loanType === '30fixed'
            ? 'Fixed rate for the full 30-year term'
            : `Intro rate for the first ${LOAN_TYPES[props.loanType].introYears} years, amortized over 30 years`}
        </p>
      </div>

      <NumberField
        label="Interest rate"
        suffix="%"
        placeholder="6.5"
        value={props.rate}
        onChange={props.onRateChange}
        hint={props.loanType !== '30fixed' ? 'Enter the ARM intro rate' : undefined}
      />

      <div className="loan-form__row">
        <NumberField
          label="Property taxes"
          prefix="$"
          suffix="/mo"
          placeholder="400"
          value={props.taxes}
          onChange={props.onTaxesChange}
        />
        <NumberField
          label="Home insurance"
          prefix="$"
          suffix="/mo"
          placeholder="120"
          value={props.insurance}
          onChange={props.onInsuranceChange}
        />
      </div>
    </form>
  )
}
