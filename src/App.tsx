import './App.css'

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

interface PlaceholderCardProps {
  title: string
  description: string
  phase: string
  children?: React.ReactNode
}

function PlaceholderCard({ title, description, phase, children }: PlaceholderCardProps) {
  return (
    <section className="card" aria-label={title}>
      <h2 className="card__title">{title}</h2>
      <div className="placeholder">
        {children}
        <p className="placeholder__text">{description}</p>
        <span className="placeholder__badge">Coming in {phase}</span>
      </div>
    </section>
  )
}

export default function App() {
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
        <PlaceholderCard
          title="Current Rates"
          description="Live 30-yr and 15-yr fixed national average rates from Freddie Mac, updated weekly."
          phase="Phase 3"
        />

        <PlaceholderCard
          title="Loan Details"
          description="Purchase price, down payment (% or $), loan type, rate, taxes, and insurance."
          phase="Phase 2"
        />

        <PlaceholderCard
          title="Monthly Payment"
          description="Your total monthly payment with a breakdown of principal & interest, taxes, and insurance."
          phase="Phase 2"
        >
          <p className="placeholder__hero numeric">$—</p>
        </PlaceholderCard>

        <PlaceholderCard
          title="Saved Templates"
          description="Save scenarios by name to compare homes and loan structures quickly."
          phase="Phase 4"
        />
      </main>
    </div>
  )
}
