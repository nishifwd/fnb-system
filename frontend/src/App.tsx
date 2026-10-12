import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { api, ApiError, type BusinessProfile, type DiningTable, type FloorArea, type FloorLayout, type MenuCategory, type MenuItem, type StaffUser } from './api'
import { BusinessSettings } from './components/BusinessSettings'
import { MenuManager } from './components/MenuManager'
import { TableManager } from './components/TableManager'
import { LoginScreen } from './components/LoginScreen'
import { StaffManager } from './components/StaffManager'
import { WaiterOrders } from './components/WaiterOrders'
import { KitchenOrders } from './components/KitchenOrders'
import './App.css'

type Section = 'overview' | 'business' | 'menu' | 'tables' | 'staff' | 'orders' | 'kitchen'
type Snapshot = {
  business: BusinessProfile | null
  categories: MenuCategory[]
  items: MenuItem[]
  areas: FloorArea[]
  layout: FloorLayout
  tables: DiningTable[]
}

const navigation: { id: Section, label: string, symbol: string }[] = [
  { id: 'overview', label: 'Overview', symbol: '◫' },
  { id: 'business', label: 'Business', symbol: '◈' },
  { id: 'menu', label: 'Menu', symbol: '☷' },
  { id: 'tables', label: 'Tables', symbol: '▦' },
  { id: 'staff', label: 'Staff', symbol: '♙' },
  { id: 'orders', label: 'Orders', symbol: '◫' },
  { id: 'kitchen', label: 'Kitchen', symbol: '▤' },
]

async function fetchSnapshot(): Promise<Snapshot> {
  const [, business, categories, items, areas, layout, tables] = await Promise.all([
    api.health(), api.business(), api.categories(), api.items(), api.areas(), api.layout(), api.tables(),
  ])
  return { business, categories, items, areas, layout, tables }
}

function App() {
  const [user, setUser] = useState<StaffUser | null | undefined>(undefined)
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
    void Promise.all([api.health(), api.csrf()]).then(() => api.me()).then(async (currentUser) => {
      if (!active) return
      setUser(currentUser)
      if (currentUser.role === 'waiter') setSection('orders')
      if (currentUser.role === 'kitchen') setSection('kitchen')
      if (currentUser.role === 'owner' || currentUser.role === 'manager') {
        const next = await fetchSnapshot()
        if (active) setSnapshot(next)
      }
    }).catch((caught) => {
      if (!active) return
      if (caught instanceof ApiError && caught.status === 401) setUser(null)
      else { setUser(null); setError(caught instanceof Error ? caught.message : 'Could not load the workspace.') }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function handleLogin(currentUser: StaffUser) {
    setUser(currentUser)
    setError('')
    setSection(currentUser.role === 'waiter' ? 'orders' : currentUser.role === 'kitchen' ? 'kitchen' : 'overview')
    if (currentUser.role === 'owner' || currentUser.role === 'manager') {
      setLoading(true)
      try { await refresh() } finally { setLoading(false) }
    }
  }

  async function handleLogout() {
    try {
      await api.logout()
      setUser(null)
      setSnapshot(null)
      setSection('overview')
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign out.')
    }
  }

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

  if (user === undefined) return <div className="login-page"><div className="panel login-card" role="status">Connecting to your workspace…</div></div>
  if (user === null) return <><LoginScreen onLogin={handleLogin} />{error && <div className="auth-error" role="alert">{error}</div>}</>

  const canManage = user.role === 'owner' || user.role === 'manager'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark">F&B</div><div><strong>F&B System</strong><small>Restaurant workspace</small></div></div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.filter((item) => {
            if (item.id === 'staff') return user.role === 'owner'
            if (item.id === 'orders') return user.role !== 'kitchen'
            if (item.id === 'kitchen') return user.role !== 'waiter'
            if (item.id === 'tables' && snapshot?.business?.service_mode === 'takeaway') return false
            return canManage
          }).map((item) => (
            <button key={item.id} type="button" className={`nav-item${section === item.id ? ' active' : ''}`} onClick={() => setSection(item.id)}>
              <span className="nav-symbol" aria-hidden="true">{item.symbol}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot"><span className="foot-dot" /> {user.name} · {user.role}</div>
      </aside>

      <div className="workspace">
        <header className="topbar"><span>Restaurant management</span><div className="topbar-actions"><span className={`connection-pill${error ? ' disconnected' : ''}`}><span />{error ? 'Attention needed' : 'Laravel connected'}</span><button type="button" className="text-button" onClick={() => void handleLogout()}>Sign out</button></div></header>
        <main className="main-content">
          {loading && <div className="panel loading-panel" role="status">Loading your workspace…</div>}
          {!loading && error && !snapshot && (
            <div className="panel loading-panel"><h2>Could not connect to Laravel</h2><p>{error}</p><Button onPress={() => void retry()}>Try again</Button></div>
          )}
          {!loading && snapshot && section === 'overview' && (
            <div className="section-stack">
              <div className="welcome-panel">
                <div><p className="eyebrow">GOOD TO SEE YOU</p><h1>{snapshot.business?.name || 'Your restaurant starts here.'}</h1><p>Keep your business details and menu ready for the next service.</p><Button variant="secondary" onPress={() => setSection('business')}>Business settings</Button></div>
                <div className="welcome-decoration" aria-hidden="true"><span /><span /><span /></div>
              </div>
              <div className="stats-grid">
                <button type="button" className="stat-card" onClick={() => setSection('business')}><span>Business profile</span><strong>{snapshot.business ? 'Ready' : 'Set up'}</strong><small>{snapshot.business ? snapshot.business.currency : 'Add your details'} ↗</small></button>
                <button type="button" className="stat-card" onClick={() => setSection('menu')}><span>Menu categories</span><strong>{snapshot.categories.length}</strong><small>Manage categories ↗</small></button>
                <button type="button" className="stat-card" onClick={() => setSection('menu')}><span>Menu items</span><strong>{snapshot.items.length}</strong><small>Manage items ↗</small></button>
                {snapshot.business?.service_mode !== 'takeaway' && <button type="button" className="stat-card" onClick={() => setSection('tables')}><span>Dining tables</span><strong>{snapshot.tables.length}</strong><small>{snapshot.areas.length} areas · Arrange floor ↗</small></button>}
              </div>
              <div className="panel next-step-panel"><div><p className="eyebrow">BUILDING BLOCKS</p><h2>Prepare your workspace</h2><p>Set up your business and menu, then use Orders and Kitchen during service. QR codes and invoices come in later phases.</p></div><Button variant="secondary" onPress={() => setSection('menu')}>Manage menu</Button></div>
            </div>
          )}
          {!loading && snapshot && section === 'business' && <BusinessSettings profile={snapshot.business} onChanged={refresh} />}
          {!loading && snapshot && section === 'menu' && <MenuManager categories={snapshot.categories} items={snapshot.items} currency={snapshot.business?.currency ?? 'MYR'} onChanged={refresh} />}
          {!loading && snapshot && section === 'tables' && <TableManager areas={snapshot.areas} layout={snapshot.layout} tables={snapshot.tables} onChanged={refresh} />}
          {!loading && user.role === 'owner' && section === 'staff' && <StaffManager />}
          {!loading && section === 'orders' && <WaiterOrders />}
          {!loading && section === 'kitchen' && <KitchenOrders />}
        </main>
      </div>
    </div>
  )
}

export default App
