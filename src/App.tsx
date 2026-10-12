import { useEffect, useState } from 'react'
import { fetchDiskHistory, fetchHealth, fetchLatestDisk } from './api/client'
import type { DiskSnapshot } from './api/types'
import { DiskWidget } from './components/DiskWidget'
import './App.css'

const REFRESH_MS = 30_000
const HISTORY_LIMIT = 48

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; latest: DiskSnapshot; history: DiskSnapshot[]; healthy: boolean }

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

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

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="brand">ELD Analytics</p>
          <h1>Local cluster disk</h1>
        </div>
        <div className="app-header__status">
          {state.status === 'ready' && (
            <span className={state.healthy ? 'badge ok' : 'badge warn'}>
              {state.healthy ? 'API up' : 'Health check failed'}
            </span>
          )}
          {updatedAt && (
            <span className="muted">Refreshed {updatedAt.toLocaleTimeString()}</span>
          )}
        </div>
      </header>

      <main>
        {state.status === 'loading' && <p className="status-line">Loading disk analytics…</p>}
        {state.status === 'error' && (
          <div className="status-line error">
            <p>Could not reach the analytics API.</p>
            <p>{state.message}</p>
            <p className="muted">
              Expecting <code>http://127.0.0.1:9010</code> (proxied as <code>/api</code>).
            </p>
          </div>
        )}
        {state.status === 'ready' && (
          <DiskWidget latest={state.latest} history={state.history} />
        )}
      </main>
    </div>
  )
}
