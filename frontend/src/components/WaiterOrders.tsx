import { useEffect, useRef, useState } from 'react'
import { Button } from '@heroui/react'
import { api, orderDestination, preparationLabel, type OrderItemInput, type ServiceCatalog, type ServiceMenuItem, type ServiceOrder } from '../api'
import { OrderItemCustomizer, type CartLine } from './OrderItemCustomizer'
import { OrderItemList } from './OrderItemList'

function footprint(shape: string, rotation: number) {
  if (shape !== 'rectangle') return { width: 60, height: 60 }
  return rotation === 90 || rotation === 270 ? { width: 54, height: 96 } : { width: 96, height: 54 }
}

export function WaiterOrders() {
  const [catalog, setCatalog] = useState<ServiceCatalog | null>(null)
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [tableId, setTableId] = useState<number | null>(null)
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in')
  const [pickupName, setPickupName] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const nextCartKey = useRef(0)
  const [editing, setEditing] = useState<{ item: ServiceMenuItem, line?: CartLine } | null>(null)
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

  async function placeOrder() {
    if (orderType === 'dine_in' && tableId === null) return
    const items: OrderItemInput[] = cart.map(({ menu_item_id, quantity, preparation, remark }) => {
      const base = { menu_item_id, quantity, remark }
      if (!preparation) return base
      return {
        ...base,
        size: preparation.size,
        ...(preparation.temperature && { temperature: preparation.temperature }),
        ...(preparation.sugar && { sugar: preparation.sugar }),
        ...(preparation.ice && { ice: preparation.ice }),
      }
    })
    if (items.length === 0) { setError('Choose at least one menu item.'); return }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const order = await api.placeOrder({
        order_type: orderType,
        ...(orderType === 'dine_in' ? { dining_table_id: tableId ?? undefined } : { pickup_name: pickupName.trim() || null }),
        note: note.trim() || null,
        items,
      })
      setCart([])
      setNote('')
      setPickupName('')
      setOrders((current) => [order, ...current])
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
      setOrders((current) => current.filter((entry) => entry.id !== order.id))
      setMessage(`Order #${order.id} marked ${order.order_type === 'takeaway' ? 'collected' : 'served'}.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update order.')
    } finally { setBusy(false) }
  }

  const selectedTable = catalog?.tables.find((table) => table.id === tableId)
  const canOrder = orderType === 'takeaway' || selectedTable !== undefined
  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const menuGroups = new Map<string, ServiceMenuItem[]>()
  for (const item of catalog?.menu ?? []) {
    const group = menuGroups.get(item.category) ?? []
    group.push(item)
    menuGroups.set(item.category, group)
  }

  function editCartLine(line: CartLine) {
    const item = catalog?.menu.find((entry) => entry.id === line.menu_item_id)
    if (item) setEditing({ item, line })
  }

  function saveCartLine(line: Omit<CartLine, 'key'>) {
    const key = editing?.line?.key ?? ++nextCartKey.current
    setCart((current) => editing?.line
      ? current.map((entry) => entry.key === key ? { ...line, key } : entry)
      : [...current, { ...line, key }])
    setEditing(null)
  }

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
          <span className="entrance-label" style={{ left: `clamp(45px, ${catalog.layout.entrance_x}%, calc(100% - 45px))`, top: `clamp(15px, ${catalog.layout.entrance_y}%, calc(100% - 15px))` }}>ENTRANCE</span>
        </div></div>
        {catalog.tables.length === 0 && <p>No tables yet. Ask a manager to add them.</p>}
      </section>}
      <section className="panel"><div className="service-heading"><h2>{orderType === 'takeaway' ? 'Takeaway order' : selectedTable ? `Order for ${selectedTable.label}` : 'New order'}</h2><span>{catalog.currency} {total.toFixed(2)}</span></div>
        {!canOrder ? <p>Choose a table to start.</p> : <>
          {orderType === 'takeaway' && <label className="field service-note">Pickup name (optional)<input value={pickupName} onChange={(event) => setPickupName(event.target.value)} maxLength={100} placeholder="Use the order number if left blank" /></label>}
          <div className="service-menu">
            {Array.from(menuGroups, ([name, groupItems]) => <section className="service-menu-group" key={name} aria-label={name}>
              <h3>{name}</h3>
              {groupItems.map((item) => <div className="service-menu-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.is_drink ? 'Drink' : 'Food'} · {catalog.currency} {item.price}</small>
                </div>
                <Button variant="secondary" isDisabled={cart.length >= 30} onPress={() => setEditing({ item })}>Customize +</Button>
              </div>)}
            </section>)}
          </div>
          {catalog.menu.length === 0 && <p>No available menu items yet. Ask a manager to add them.</p>}
          {cart.length > 0 && <div className="cart-section">
            <h3>Order items <span>{cart.length}</span></h3>
            {cart.map((line) => <div className="cart-line" key={line.key}>
              <div>
                <strong>{line.quantity} × {line.name}</strong>
                {line.preparation && <small>{preparationLabel(line.preparation)}</small>}
                {line.remark && <small>Remark: {line.remark}</small>}
              </div>
              <div className="cart-line-actions">
                <span>{catalog.currency} {(line.price * line.quantity).toFixed(2)}</span>
                <Button variant="secondary" isDisabled={!catalog.menu.some((item) => item.id === line.menu_item_id)} onPress={() => editCartLine(line)}>Edit</Button>
                <Button variant="secondary" onPress={() => setCart((current) => current.filter((entry) => entry.key !== line.key))}>Remove</Button>
              </div>
            </div>)}
          </div>}
          <label className="field service-note">Kitchen note<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={2} placeholder="Optional note for the whole order" /></label>
          <Button onPress={() => void placeOrder()} isDisabled={busy || cart.length === 0}>Send order · {catalog.currency} {total.toFixed(2)}</Button>
        </>}
      </section>
    </div></>}
    <section className="panel">
      <div className="service-heading"><h2>Open orders</h2><Button variant="secondary" onPress={() => void refreshOrders()}>Refresh</Button></div>
      <div className="order-list">
        {orders.map((order) => <div className="order-card" key={order.id}>
          <div className="order-card-head">
            <div>
              <strong>#{order.id} · {orderDestination(order)}</strong>
              <small>{new Date(order.created_at).toLocaleTimeString()}</small>
            </div>
            <span className={`order-status ${order.status}`}>{order.status}</span>
          </div>
          <OrderItemList items={order.items} />
          {order.note && <small>Order note: {order.note}</small>}
          {order.status === 'ready' && <Button variant="secondary" isDisabled={busy} onPress={() => void markServed(order)}>
            {order.order_type === 'takeaway' ? 'Mark collected' : 'Mark served'}
          </Button>}
        </div>)}
      </div>
      {orders.length === 0 && <p>No open orders.</p>}
    </section>
    {editing && catalog && <OrderItemCustomizer
      key={`${editing.item.id}-${editing.line?.key ?? 'new'}`}
      item={editing.item}
      initial={editing.line}
      currency={catalog.currency}
      onClose={() => setEditing(null)}
      onSave={saveCartLine}
    />}
  </div>
}
