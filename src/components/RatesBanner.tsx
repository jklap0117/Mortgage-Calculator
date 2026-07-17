import { useEffect, useState } from 'react'
import {
  fetchRates,
  formatObservationDate,
  readCachedRates,
  writeCachedRates,
  type Rates,
} from '../lib/rates'

type BannerState =
  | { status: 'loading' }
  | { status: 'live'; rates: Rates }
  | { status: 'cached'; rates: Rates }
  | { status: 'error' }

interface RatesBannerProps {
  onUseRate: (rate: number) => void
}

function RateSkeleton() {
  return (
    <div className="rates" aria-hidden="true">
      <div className="rates__grid">
        <div className="rates__item">
          <span className="skeleton skeleton--label" />
          <span className="skeleton skeleton--rate" />
        </div>
        <div className="rates__item">
          <span className="skeleton skeleton--label" />
          <span className="skeleton skeleton--rate" />
        </div>
      </div>
      <span className="skeleton skeleton--footnote" />
    </div>
  )
}

export default function RatesBanner({ onUseRate }: RatesBannerProps) {
  const [state, setState] = useState<BannerState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetchRates()
      .then((rates) => {
        writeCachedRates(rates)
        if (!cancelled) setState({ status: 'live', rates })
      })
      .catch(() => {
        if (cancelled) return
        const cached = readCachedRates()
        setState(cached ? { status: 'cached', rates: cached } : { status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return <RateSkeleton />
  }

  if (state.status === 'error') {
    return (
      <p className="rates__unavailable">
        Live rates are unavailable right now. Check your connection and reload, or enter a
        rate manually below.
      </p>
    )
  }

  const { rates } = state
  const dateText = formatObservationDate(rates.asOf)

  return (
    <div className="rates">
      <div className="rates__grid">
        <div className="rates__item">
          <span className="rates__label">30-yr fixed</span>
          <span className="rates__value">
            {rates.rate30}
            <span className="rates__unit">%</span>
          </span>
          <button
            type="button"
            className="rates__use-button"
            onClick={() => onUseRate(rates.rate30)}
          >
            Use this rate
          </button>
        </div>
        <div className="rates__item">
          <span className="rates__label">15-yr fixed</span>
          <span className="rates__value">
            {rates.rate15}
            <span className="rates__unit">%</span>
          </span>
        </div>
      </div>
      <p className="rates__footnote">
        {state.status === 'cached' && (
          <span className="rates__offline-badge">Offline — saved rates</span>
        )}
        Freddie Mac national average, as of {dateText}
      </p>
    </div>
  )
}
