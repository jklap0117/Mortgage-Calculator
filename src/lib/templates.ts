/** Scenario templates: localStorage persistence + pure list operations. */

import {
  autoLoanAmount,
  downPaymentDollars,
  LOAN_TYPES,
  paymentBreakdown,
  type LoanType,
} from './mortgage'
import { formatCurrency, parseNumeric } from './format'

/** Every calculator input, as the raw strings the form holds. */
export interface ScenarioValues {
  purchasePrice: string
  downPaymentMode: '%' | '$'
  downPaymentValue: string
  /** null = auto (price − down payment) */
  loanAmountOverride: string | null
  rate: string
  loanType: LoanType
  monthlyTaxes: string
  monthlyInsurance: string
}

export interface ScenarioTemplate extends ScenarioValues {
  id: string
  name: string
  createdAt: string
}

const STORAGE_KEY = 'mortgage-calculator:templates'
const STORE_VERSION = 1

interface TemplateStoreEnvelope {
  version: number
  templates: ScenarioTemplate[]
}

function isScenarioTemplate(value: unknown): value is ScenarioTemplate {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.name === 'string' &&
    typeof v.createdAt === 'string' &&
    typeof v.purchasePrice === 'string' &&
    (v.downPaymentMode === '%' || v.downPaymentMode === '$') &&
    typeof v.downPaymentValue === 'string' &&
    (v.loanAmountOverride === null || typeof v.loanAmountOverride === 'string') &&
    typeof v.rate === 'string' &&
    typeof v.loanType === 'string' &&
    v.loanType in LOAN_TYPES &&
    typeof v.monthlyTaxes === 'string' &&
    typeof v.monthlyInsurance === 'string'
  )
}

export function loadTemplates(storage: Pick<Storage, 'getItem'>): ScenarioTemplate[] {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<TemplateStoreEnvelope>
    if (parsed.version !== STORE_VERSION || !Array.isArray(parsed.templates)) return []
    return parsed.templates.filter(isScenarioTemplate)
  } catch {
    return []
  }
}

export function saveTemplates(
  storage: Pick<Storage, 'setItem'>,
  templates: ScenarioTemplate[],
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORE_VERSION, templates }))
  } catch {
    // Storage full or unavailable — persistence is best-effort
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createTemplate(name: string, values: ScenarioValues): ScenarioTemplate {
  return {
    ...values,
    id: generateId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }
}

export function renameTemplate(
  templates: ScenarioTemplate[],
  id: string,
  name: string,
): ScenarioTemplate[] {
  return templates.map((t) => (t.id === id ? { ...t, name: name.trim() } : t))
}

export function deleteTemplate(templates: ScenarioTemplate[], id: string): ScenarioTemplate[] {
  return templates.filter((t) => t.id !== id)
}

export function updateTemplateValues(
  templates: ScenarioTemplate[],
  id: string,
  values: ScenarioValues,
): ScenarioTemplate[] {
  return templates.map((t) =>
    t.id === id ? { ...values, id: t.id, name: t.name, createdAt: t.createdAt } : t,
  )
}

export function sameValues(a: ScenarioValues, b: ScenarioValues): boolean {
  return (
    a.purchasePrice === b.purchasePrice &&
    a.downPaymentMode === b.downPaymentMode &&
    a.downPaymentValue === b.downPaymentValue &&
    a.loanAmountOverride === b.loanAmountOverride &&
    a.rate === b.rate &&
    a.loanType === b.loanType &&
    a.monthlyTaxes === b.monthlyTaxes &&
    a.monthlyInsurance === b.monthlyInsurance
  )
}

/** Loan amount a template's values imply (override wins, else price − down payment). */
export function templateLoanAmount(values: ScenarioValues): number {
  if (values.loanAmountOverride !== null) return parseNumeric(values.loanAmountOverride)
  const price = parseNumeric(values.purchasePrice)
  const dp = downPaymentDollars(
    price,
    values.downPaymentMode,
    parseNumeric(values.downPaymentValue),
  )
  return autoLoanAmount(price, dp)
}

/** One-line summary: "$450,000 · 30-yr Fixed · $2,795/mo". */
export function templateSummary(template: ScenarioTemplate): string {
  const price = formatCurrency(parseNumeric(template.purchasePrice))
  const label = LOAN_TYPES[template.loanType].label
  const total = paymentBreakdown(
    templateLoanAmount(template),
    parseNumeric(template.rate),
    parseNumeric(template.monthlyTaxes),
    parseNumeric(template.monthlyInsurance),
  ).total
  return `${price} · ${label} · ${formatCurrency(total)}/mo`
}
