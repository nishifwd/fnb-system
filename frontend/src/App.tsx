import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { api, type BusinessProfile, type DiningTable, type MenuCategory, type MenuItem } from './api'
import { BusinessSettings } from './components/BusinessSettings'
import { MenuManager } from './components/MenuManager'
import { TableManager } from './components/TableManager'
import './App.css'

type Section = 'overview' | 'business' | 'menu' | 'tables'
type Snapshot = {
  business: BusinessProfile | null
  categories: MenuCategory[]
  items: MenuItem[]
  tables: DiningTable[]
}

const navigation: { id: Section, label: string, symbol: string }[] = [
  { id: 'overview', label: 'Overview', symbol: '◫' },
  { id: 'business', label: 'Business', symbol: '◈' },
  { id: 'menu', label: 'Menu', symbol: '☷' },
  { id: 'tables', label: 'Tables', symbol: '▦' },
]

async function fetchSnapshot(): Promise<Snapshot> {
  const [, business, categories, items, tables] = await Promise.all([
    api.health(), api.business(), api.categories(), api.items(), api.tables(),
  ])
  return { business, categories, items, tables }
}

function App() {
  const [section, setSection] = useState<Section>('overview')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const next = await fetchSnapshot()
      setSnapshot(next)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load the workspace.')
      throw caught
    }
  }

  useEffect(() => {
    let active = true
    void fetchSnapshot().then((next) => {
      if (active) setSnapshot(next)
    }).catch((caught) => {
      if (active) setError(caught instanceof Error ? caught.message : 'Could not load the workspace.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function retry() {
    setLoading(true)
    setError('')
    try {
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load the workspace.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark">F&B</div><div><strong>F&B System</strong><small>Restaurant workspace</small></div></div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <button key={item.id} type="button" className={`nav-item${section === item.id ? ' active' : ''}`} onClick={() => setSection(item.id)}>
              <span className="nav-symbol" aria-hidden="true">{item.symbol}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot"><span className="foot-dot" /> Phase 2 · Management</div>
      </aside>

      <div className="workspace">
        <header className="topbar"><span>Restaurant management</span><span className={`connection-pill${error ? ' disconnected' : ''}`}><span />{error ? 'Disconnected' : 'Laravel connected'}</span></header>
        <main className="main-content">
          {loading && <div className="panel loading-panel" role="status">Loading your workspace…</div>}
          {!loading && error && !snapshot && (
            <div className="panel loading-panel"><h2>Could not connect to Laravel</h2><p>{error}</p><Button onPress={() => void retry()}>Try again</Button></div>
          )}
          {!loading && snapshot && section === 'overview' && (
            <div className="section-stack">
              <div className="welcome-panel">
                <div><p className="eyebrow">GOOD TO SEE YOU</p><h1>{snapshot.business?.name || 'Your restaurant starts here.'}</h1><p>Keep your business details, menu, and tables ready for the next service.</p><Button variant="secondary" onPress={() => setSection('business')}>Business settings</Button></div>
                <div className="welcome-decoration" aria-hidden="true"><span /><span /><span /></div>
              </div>
              <div className="stats-grid">
                <button type="button" className="stat-card" onClick={() => setSection('business')}><span>Business profile</span><strong>{snapshot.business ? 'Ready' : 'Set up'}</strong><small>{snapshot.business ? snapshot.business.currency : 'Add your details'} ↗</small></button>
                <button type="button" className="stat-card" onClick={() => setSection('menu')}><span>Menu categories</span><strong>{snapshot.categories.length}</strong><small>Manage categories ↗</small></button>
                <button type="button" className="stat-card" onClick={() => setSection('menu')}><span>Menu items</span><strong>{snapshot.items.length}</strong><small>Manage items ↗</small></button>
                <button type="button" className="stat-card" onClick={() => setSection('tables')}><span>Dining tables</span><strong>{snapshot.tables.length}</strong><small>Arrange floor ↗</small></button>
              </div>
              <div className="panel next-step-panel"><div><p className="eyebrow">BUILDING BLOCKS</p><h2>Prepare your workspace</h2><p>Start with your business details, then add menu items and arrange tables. Ordering, kitchen tracking, QR codes, and invoices come in later phases.</p></div><Button variant="secondary" onPress={() => setSection('menu')}>Manage menu</Button></div>
            </div>
          )}
          {!loading && snapshot && section === 'business' && <BusinessSettings profile={snapshot.business} onChanged={refresh} />}
          {!loading && snapshot && section === 'menu' && <MenuManager categories={snapshot.categories} items={snapshot.items} currency={snapshot.business?.currency ?? 'MYR'} onChanged={refresh} />}
          {!loading && snapshot && section === 'tables' && <TableManager tables={snapshot.tables} onChanged={refresh} />}
        </main>
      </div>
    </div>
  )
}

export default App
