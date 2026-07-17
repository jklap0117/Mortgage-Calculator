import { useId } from 'react'
import { parseNumeric, sanitizeDecimalInput } from '../lib/format'

interface NumberFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  prefix?: string
  suffix?: string
  placeholder?: string
  hint?: React.ReactNode
  /** Right-aligned control rendered in the label row (toggles, reset buttons). */
  labelAction?: React.ReactNode
  /** Reject input that parses above this value (negatives are already impossible). */
  max?: number
}

export default function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  hint,
  labelAction,
  max,
}: NumberFieldProps) {
  const id = useId()
  return (
    <div className="field">
      <div className="field__label-row">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className="field__control">
        {prefix && <span className="field__adornment">{prefix}</span>}
        <input
          id={id}
          className="field__input numeric"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const next = sanitizeDecimalInput(e.target.value)
            if (max !== undefined && parseNumeric(next) > max) return
            onChange(next)
          }}
        />
        {suffix && <span className="field__adornment">{suffix}</span>}
      </div>
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  )
}
