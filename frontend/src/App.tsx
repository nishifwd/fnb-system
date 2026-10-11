import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import './App.css'

type ConnectionStatus = 'checking' | 'online' | 'offline'

async function fetchHealth(signal?: AbortSignal): Promise<void> {
  const response = await fetch('/api/v1/health', { signal })
  if (!response.ok) {
    throw new Error('Health request failed')
  }

  const health: unknown = await response.json()
  if (
    typeof health !== 'object' ||
    health === null ||
    !('status' in health) ||
    health.status !== 'ok'
  ) {
    throw new Error('Unexpected health response')
  }
}

function App() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking')

  function checkConnection(signal?: AbortSignal) {
    void fetchHealth(signal).then(() => setConnectionStatus('online')).catch(() => {
      if (!signal?.aborted) {
        setConnectionStatus('offline')
      }
    })
  }

  useEffect(() => {
    const controller = new AbortController()
    checkConnection(controller.signal)
    return () => controller.abort()
  }, [])

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="brand-mark" aria-hidden="true">F&B</div>
        <div>
          <p className="brand-name">F&B System</p>
          <p className="brand-caption">Restaurant & café workspace</p>
        </div>
        <span className="phase-badge">Phase 1 · Foundation</span>
      </header>

      <main>
        <section className="hero-panel" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">WELCOME TO YOUR WORKSPACE</p>
            <h1 id="page-title">A better flow for every table.</h1>
            <p className="hero-copy">
              The foundation is ready. This app will grow into one place for
              service, kitchen, and management teams.
            </p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-circle art-circle-one" />
            <div className="art-circle art-circle-two" />
            <div className="art-table"><span>01</span></div>
            <div className="art-table art-table-small"><span>02</span></div>
          </div>
        </section>

        <section className="content-grid" aria-label="System overview">
          <div className="panel connection-panel">
            <p className="section-label">SYSTEM STATUS</p>
            <h2>Backend connection</h2>
            <p className="panel-copy">The React app checks the Laravel API when this page opens.</p>
            <div className={`status-row status-${connectionStatus}`} role="status" aria-live="polite">
              <span className="status-dot" aria-hidden="true" />
              <span>
                {connectionStatus === 'checking' && 'Checking connection…'}
                {connectionStatus === 'online' && 'Laravel API connected'}
                {connectionStatus === 'offline' && 'Laravel API unavailable'}
              </span>
            </div>
            {connectionStatus === 'offline' && (
              <p className="help-text">Start Laravel on port 8001, then try again.</p>
            )}
            <Button variant="secondary" isDisabled={connectionStatus === 'checking'} onPress={() => {
              setConnectionStatus('checking')
              checkConnection()
            }}>
              Check again
            </Button>
          </div>

          <div className="panel next-panel">
            <p className="section-label">COMING LATER</p>
            <h2>Built for the whole floor</h2>
            <p className="panel-copy">These workflows are planned for future phases.</p>
            <ul className="feature-list">
              <li><span>01</span> Tables & floor layout</li>
              <li><span>02</span> Staff & QR ordering</li>
              <li><span>03</span> Kitchen tracking</li>
              <li><span>04</span> Billing & invoices</li>
            </ul>
          </div>
        </section>
      </main>

      <footer>F&B System · A foundation for better service</footer>
    </div>
  )
}

export default App
