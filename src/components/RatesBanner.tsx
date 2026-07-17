import { useEffect, useState } from 'react'
import {
  fetchRates,
  formatAsOfDate,
  loadCachedRates,
  saveCachedRates,
  type RatesData,
} from '../lib/rates'
const formatRate = (rate: number) => rate.toFixed(2)

type BannerState =
  | { status: 'loading' }
  | { status: 'live'; data: RatesData }
  | { status: 'cached'; data: RatesData }
  | { status: 'unavailable' }

interface RatesBannerProps {
  onUseRate: (rate: number) => void
}

export default function RatesBanner({ onUseRate }: RatesBannerProps) {
  const [state, setState] = useState<BannerState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetchRates()
      .then((data) => {
        saveCachedRates(window.localStorage, data)
        if (!cancelled) setState({ status: 'live', data })
      })
      .catch(() => {
        if (cancelled) return
        const cached = loadCachedRates(window.localStorage)
        setState(cached ? { status: 'cached', data: cached } : { status: 'unavailable' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <div className="rates" aria-busy="true" aria-label="Loading current rates">
        <div className="rates__row">
          <div className="rates__item">
            <span className="skeleton skeleton--label" />
            <span className="skeleton skeleton--value" />
          </div>
          <div className="rates__item">
            <span className="skeleton skeleton--label" />
            <span className="skeleton skeleton--value" />
          </div>
        </div>
        <span className="skeleton skeleton--caption" />
      </div>
    )
  }

  if (state.status === 'unavailable') {
    return (
      <div className="rates">
        <p className="rates__empty">
          Current rates aren&rsquo;t available right now. Enter a rate manually below —
          live rates will appear once you&rsquo;re back online.
        </p>
      </div>
    )
  }

  const { data } = state
  return (
    <div className="rates">
      <div className="rates__row">
        <div className="rates__item">
          <span className="rates__label">30-yr fixed</span>
          <span className="rates__value numeric">{formatRate(data.rate30)}%</span>
          <button
            type="button"
            className="rates__use"
            onClick={() => onUseRate(data.rate30)}
          >
            Use this rate
          </button>
        </div>
        <div className="rates__item">
          <span className="rates__label">15-yr fixed</span>
          <span className="rates__value numeric">{formatRate(data.rate15)}%</span>
        </div>
      </div>
      <p className="rates__caption">
        Freddie Mac national average, as of {formatAsOfDate(data.asOf)}
        {state.status === 'cached' && (
          <span className="rates__badge">offline — last saved</span>
        )}
      </p>
    </div>
  )
}
