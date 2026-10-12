import { useEffect, useState } from 'react'
import { fetchDiskHistory, fetchHealth, fetchLatestDisk } from './api/client'
import type { DiskSnapshot } from './api/types'
import { DiskWidget } from './components/DiskWidget'
import './App.css'

const REFRESH_MS = 30_000
const HISTORY_LIMIT = 48
const THEME_KEY = 'eld-home-theme'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; latest: DiskSnapshot; history: DiskSnapshot[]; healthy: boolean }

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(THEME_KEY) === 'light'
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [latest, history] = await Promise.all([
          fetchLatestDisk(),
          fetchDiskHistory(HISTORY_LIMIT),
        ])
        let healthy = true
        try {
          await fetchHealth()
        } catch {
          healthy = false
        }
        if (cancelled) return
        setState({ status: 'ready', latest, history, healthy })
        setUpdatedAt(new Date())
      } catch (error) {
        if (cancelled) return
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load analytics',
        })
      }
    }

    void load()
    const id = window.setInterval(() => void load(), REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const toggleTheme = () => {
    setIsLightTheme((prev) => {
      const next = !prev
      window.localStorage.setItem(THEME_KEY, next ? 'light' : 'dark')
      return next
    })
  }

  const apiLabel =
    state.status === 'ready' ? (state.healthy ? 'up' : 'down') : state.status === 'error' ? 'down' : '…'

  return (
    <div className={`eld-shell${isLightTheme ? ' eld-shell--light' : ''}`}>
      <header className="shell-header">
        <div className="shell-brand">
          <span className="shell-brand__mark">E</span>
          <p className="shell-brand__text">ELD Analytics</p>
        </div>
        <div className="shell-meta">
          <div className="shell-meta__stack">
            <div className="shell-meta__row">
              <span className="shell-meta__label">api:</span>
              <span
                className={`shell-meta__value${
                  apiLabel === 'up' ? ' is-ok' : apiLabel === 'down' ? ' is-bad' : ''
                }`}
              >
                {apiLabel}
              </span>
            </div>
            <div className="shell-meta__row">
              <span className="shell-meta__label">refreshed:</span>
              <span className="shell-meta__value">
                {updatedAt ? updatedAt.toLocaleTimeString() : '--'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
            title={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLightTheme ? 'Dark' : 'Light'}
          </button>
        </div>
      </header>

      <div className="app">
        <header className="app-header">
          <div>
            <p className="eyebrow">Local cluster</p>
            <h1>Disk analytics</h1>
          </div>
        </header>

        <main>
          {state.status === 'loading' && <p className="status-line">Loading disk analytics…</p>}
          {state.status === 'error' && (
            <div className="status-line error">
              <p>Could not reach the analytics API.</p>
              <p>{state.message}</p>
              <p className="muted">
                Check <code>ANALYTICS_API_URL</code> in <code>.env</code> (proxied as <code>/api</code>).
              </p>
            </div>
          )}
          {state.status === 'ready' && (
            <DiskWidget latest={state.latest} history={state.history} />
          )}
        </main>
      </div>
    </div>
  )
}
