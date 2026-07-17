import { useState } from 'react'
import './App.css'
import LoanDetailsForm, { type DownPaymentMode } from './components/LoanDetailsForm'
import PaymentResult from './components/PaymentResult'
import RatesBanner from './components/RatesBanner'
import TemplateList from './components/TemplateList'
import {
  autoLoanAmount,
  downPaymentDollars,
  downPaymentPercent,
  paymentBreakdown,
  type LoanType,
} from './lib/mortgage'
import { parseNumeric } from './lib/format'
import {
  createTemplate,
  deleteTemplate,
  loadTemplates,
  renameTemplate,
  sameValues,
  saveTemplates,
  updateTemplateValues,
  type ScenarioTemplate,
  type ScenarioValues,
} from './lib/templates'

function HouseMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}

export default function App() {
  const [price, setPrice] = useState('450000')
  const [downPaymentMode, setDownPaymentMode] = useState<DownPaymentMode>('%')
  const [downPaymentValue, setDownPaymentValue] = useState('20')
  const [loanAmountOverride, setLoanAmountOverride] = useState<string | null>(null)
  const [rate, setRate] = useState('6.5')
  const [loanType, setLoanType] = useState<LoanType>('30fixed')
  const [taxes, setTaxes] = useState('400')
  const [insurance, setInsurance] = useState('120')

  const [templates, setTemplates] = useState<ScenarioTemplate[]>(() =>
    loadTemplates(window.localStorage),
  )
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)

  const currentValues: ScenarioValues = {
    purchasePrice: price,
    downPaymentMode,
    downPaymentValue,
    loanAmountOverride,
    rate,
    loanType,
    monthlyTaxes: taxes,
    monthlyInsurance: insurance,
  }
  const activeTemplate = templates.find((t) => t.id === activeTemplateId) ?? null
  const activeModified = activeTemplate !== null && !sameValues(currentValues, activeTemplate)

  function commitTemplates(next: ScenarioTemplate[]) {
    setTemplates(next)
    saveTemplates(window.localStorage, next)
  }

  function handleSaveNewTemplate(name: string) {
    const template = createTemplate(name, currentValues)
    commitTemplates([...templates, template])
    setActiveTemplateId(template.id)
  }

  function handleLoadTemplate(id: string) {
    const template = templates.find((t) => t.id === id)
    if (!template) return
    setPrice(template.purchasePrice)
    setDownPaymentMode(template.downPaymentMode)
    setDownPaymentValue(template.downPaymentValue)
    setLoanAmountOverride(template.loanAmountOverride)
    setRate(template.rate)
    setLoanType(template.loanType)
    setTaxes(template.monthlyTaxes)
    setInsurance(template.monthlyInsurance)
    setActiveTemplateId(id)
  }

  function handleDeleteTemplate(id: string) {
    commitTemplates(deleteTemplate(templates, id))
    if (id === activeTemplateId) setActiveTemplateId(null)
  }

  function handleUpdateActiveTemplate() {
    if (activeTemplateId === null) return
    commitTemplates(updateTemplateValues(templates, activeTemplateId, currentValues))
  }

  const priceNum = parseNumeric(price)
  const dpNum = parseNumeric(downPaymentValue)
  const dpDollars = downPaymentDollars(priceNum, downPaymentMode, dpNum)
  const dpPercent = downPaymentPercent(priceNum, downPaymentMode, dpNum)
  const autoLoan = autoLoanAmount(priceNum, dpDollars)
  const loanAmount = loanAmountOverride !== null ? parseNumeric(loanAmountOverride) : autoLoan
  const loanAmountText =
    loanAmountOverride ?? (autoLoan > 0 ? String(Math.round(autoLoan)) : '')

  const breakdown = paymentBreakdown(
    loanAmount,
    parseNumeric(rate),
    parseNumeric(taxes),
    parseNumeric(insurance),
  )

  function handleDownPaymentModeChange(mode: DownPaymentMode) {
    if (mode === downPaymentMode) return
    // Convert the entered value so the down payment stays equivalent
    if (dpNum > 0 && priceNum > 0) {
      if (mode === '$') {
        setDownPaymentValue(String(Math.round((priceNum * dpNum) / 100)))
      } else {
        setDownPaymentValue(String(Number(((dpNum / priceNum) * 100).toFixed(2))))
      }
    }
    setDownPaymentMode(mode)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__mark">
          <HouseMark />
        </div>
        <div>
          <h1 className="app-header__title">Mortgage Calculator</h1>
          <p className="app-header__subtitle">Estimate your monthly payment in seconds</p>
        </div>
      </header>

      <main style={{ display: 'contents' }}>
        <section className="card" aria-label="Current Rates">
          <h2 className="card__title">Current Rates</h2>
          <RatesBanner onUseRate={(r) => setRate(String(r))} />
        </section>

        <section className="card" aria-label="Loan Details">
          <h2 className="card__title">Loan Details</h2>
          <LoanDetailsForm
            price={price}
            onPriceChange={setPrice}
            downPaymentMode={downPaymentMode}
            onDownPaymentModeChange={handleDownPaymentModeChange}
            downPaymentValue={downPaymentValue}
            onDownPaymentValueChange={setDownPaymentValue}
            downPaymentDollarsValue={dpDollars}
            downPaymentPercentValue={dpPercent}
            loanAmountText={loanAmountText}
            onLoanAmountChange={setLoanAmountOverride}
            loanAmountOverridden={loanAmountOverride !== null}
            onResetLoanAmount={() => setLoanAmountOverride(null)}
            rate={rate}
            onRateChange={setRate}
            loanType={loanType}
            onLoanTypeChange={setLoanType}
            taxes={taxes}
            onTaxesChange={setTaxes}
            insurance={insurance}
            onInsuranceChange={setInsurance}
          />
        </section>

        <section className="card" aria-label="Monthly Payment">
          <h2 className="card__title">Monthly Payment</h2>
          <PaymentResult
            breakdown={breakdown}
            loanAmount={loanAmount}
            downPaymentDollars={dpDollars}
            downPaymentPercent={dpPercent}
            loanType={loanType}
          />
        </section>

        <section className="card" aria-label="Saved Templates">
          <h2 className="card__title">Saved Templates</h2>
          <TemplateList
            templates={templates}
            activeTemplateId={activeTemplateId}
            activeModified={activeModified}
            onSaveNew={handleSaveNewTemplate}
            onLoad={handleLoadTemplate}
            onRename={(id, name) => commitTemplates(renameTemplate(templates, id, name))}
            onDelete={handleDeleteTemplate}
            onUpdateActive={handleUpdateActiveTemplate}
          />
        </section>
      </main>
    </div>
  )
}
