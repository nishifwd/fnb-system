import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { api, orderDestination, type ServiceCatalog, type ServiceOrder } from '../api'

function footprint(shape: string, rotation: number) {
  if (shape !== 'rectangle') return { width: 76, height: 76 }
  return rotation === 90 || rotation === 270 ? { width: 68, height: 120 } : { width: 120, height: 68 }
}

export function WaiterOrders() {
  const [catalog, setCatalog] = useState<ServiceCatalog | null>(null)
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [tableId, setTableId] = useState<number | null>(null)
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in')
  const [pickupName, setPickupName] = useState('')
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function refreshOrders() { setOrders(await api.orders()) }

  useEffect(() => {
    let active = true
    void Promise.all([api.serviceCatalog(), api.orders()]).then(([nextCatalog, nextOrders]) => {
      if (active) {
        setCatalog(nextCatalog)
        setOrders(nextOrders)
        setOrderType(nextCatalog.service_mode === 'takeaway' ? 'takeaway' : 'dine_in')
      }
    }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Could not load service.') })
    const timer = window.setInterval(() => { void api.orders().then((next) => { if (active) setOrders(next) }).catch(() => {}) }, 10000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  function changeQuantity(id: number, change: number) {
    setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(20, (current[id] ?? 0) + change)) }))
  }

  async function placeOrder() {
    if (orderType === 'dine_in' && tableId === null) return
    const items = Object.entries(quantities).filter(([, quantity]) => quantity > 0)
      .map(([id, quantity]) => ({ menu_item_id: Number(id), quantity }))
    if (items.length === 0) { setError('Choose at least one menu item.'); return }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const order = await api.placeOrder({
        order_type: orderType,
        ...(orderType === 'dine_in' ? { dining_table_id: tableId! } : { pickup_name: pickupName.trim() || null }),
        note: note.trim() || null,
        items,
      })
      await refreshOrders()
      setQuantities({})
      setNote('')
      setPickupName('')
      setMessage(`Order #${order.id} sent to the kitchen.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not place order.')
    } finally { setBusy(false) }
  }

  async function markServed(order: ServiceOrder) {
    setBusy(true)
    setError('')
    try {
      await api.updateOrderStatus(order.id, 'served')
      await refreshOrders()
      setMessage(`Order #${order.id} marked ${order.order_type === 'takeaway' ? 'collected' : 'served'}.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update order.')
    } finally { setBusy(false) }
  }

  const selectedTable = catalog?.tables.find((table) => table.id === tableId)
  const canOrder = orderType === 'takeaway' || selectedTable !== undefined
  const selectedLines = catalog?.menu.filter((item) => (quantities[item.id] ?? 0) > 0) ?? []
  const total = selectedLines.reduce((sum, item) => sum + Number(item.price) * (quantities[item.id] ?? 0), 0)

  return <div className="section-stack">
    <div className="section-heading"><div><p className="eyebrow">SERVICE</p><h1>Orders</h1></div><p>Choose dine-in or takeaway, then send items to the kitchen.</p></div>
    {error && <div className="error-message" role="alert">{error}</div>}
    {message && <div className="success-message" role="status">{message}</div>}
    {!catalog && !error && <div className="panel" role="status">Loading tables and menu…</div>}
    {catalog && <>
      <div className="service-mode-tabs" role="group" aria-label="Order type">
        {catalog.service_mode !== 'takeaway' && <button type="button" className={orderType === 'dine_in' ? 'active' : ''} onClick={() => setOrderType('dine_in')}>Dine-in</button>}
        {catalog.service_mode !== 'dine_in' && <button type="button" className={orderType === 'takeaway' ? 'active' : ''} onClick={() => setOrderType('takeaway')}>Takeaway</button>}
      </div>
      <div className={`service-grid${orderType === 'takeaway' ? ' takeaway-grid' : ''}`}>
      {orderType === 'dine_in' && <section className="panel"><div className="service-heading"><h2>Choose a table</h2><span>{catalog.tables.length} tables</span></div>
        <div className="service-board-wrap"><div className="floor-board service-board" aria-label="Restaurant floor plan">
          {catalog.areas.map((area) => <div key={area.id} className="floor-zone" style={{ left: `${area.position_x}%`, top: `${area.position_y}%`, width: `${area.width}%`, height: `${area.height}%` }}><span className="zone-heading">{area.name}</span>
            {catalog.tables.filter((table) => table.floor_area_id === area.id).map((table) => {
              const size = footprint(table.shape, table.rotation)
              return <button key={table.id} type="button" className={`floor-table shape-${table.shape} rotation-${table.rotation}${tableId === table.id ? ' selected' : ''}`} style={{ left: `min(${table.position_x}%, calc(100% - ${size.width}px))`, top: `min(${table.position_y}%, calc(100% - ${size.height}px))` }} aria-label={`Select table ${table.label}, ${table.capacity} seats in ${area.name}`} onClick={() => { setTableId(table.id); setMessage('') }}><span className="orientation-marker" aria-hidden="true" /><strong>{table.label}</strong><small>{table.capacity} seats</small></button>
            })}
          </div>)}
          <span className={`entrance-label entrance-${catalog.layout.entrance_side}`} style={catalog.layout.entrance_side === 'top' || catalog.layout.entrance_side === 'bottom' ? { left: `${catalog.layout.entrance_offset}%` } : { top: `${catalog.layout.entrance_offset}%` }}>ENTRANCE</span>
        </div></div>
        {catalog.tables.length === 0 && <p>No tables yet. Ask a manager to add them.</p>}
      </section>}
      <section className="panel"><div className="service-heading"><h2>{orderType === 'takeaway' ? 'Takeaway order' : selectedTable ? `Order for ${selectedTable.label}` : 'New order'}</h2><span>{catalog.currency} {total.toFixed(2)}</span></div>
        {!canOrder ? <p>Choose a table to start.</p> : <>
          {orderType === 'takeaway' && <label className="field service-note">Pickup name (optional)<input value={pickupName} onChange={(event) => setPickupName(event.target.value)} maxLength={100} placeholder="Use the order number if left blank" /></label>}
          <div className="service-menu">{catalog.menu.map((item) => <div className="service-menu-item" key={item.id}><div><strong>{item.name}</strong><small>{item.category} · {catalog.currency} {item.price}</small></div><div className="quantity-control"><button type="button" aria-label={`Remove ${item.name}`} onClick={() => changeQuantity(item.id, -1)}>−</button><span>{quantities[item.id] ?? 0}</span><button type="button" aria-label={`Add ${item.name}`} onClick={() => changeQuantity(item.id, 1)}>+</button></div></div>)}</div>
          {catalog.menu.length === 0 && <p>No available menu items yet. Ask a manager to add them.</p>}
          <label className="field service-note">Kitchen note<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={2} placeholder="Optional, e.g. no sugar" /></label>
          <Button onPress={() => void placeOrder()} isDisabled={busy || selectedLines.length === 0}>Send order · {catalog.currency} {total.toFixed(2)}</Button>
        </>}
      </section>
    </div></>}
    <section className="panel"><div className="service-heading"><h2>Open orders</h2><Button variant="secondary" onPress={() => void refreshOrders()}>Refresh</Button></div>
      <div className="order-list">{orders.map((order) => <div className="order-card" key={order.id}><div className="order-card-head"><div><strong>#{order.id} · {orderDestination(order)}</strong><small>{new Date(order.created_at).toLocaleTimeString()}</small></div><span className={`order-status ${order.status}`}>{order.status}</span></div><p>{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</p>{order.note && <small>Note: {order.note}</small>}{order.status === 'ready' && <Button variant="secondary" isDisabled={busy} onPress={() => void markServed(order)}>{order.order_type === 'takeaway' ? 'Mark collected' : 'Mark served'}</Button>}</div>)}</div>
      {orders.length === 0 && <p>No open orders.</p>}
    </section>
  </div>
}
