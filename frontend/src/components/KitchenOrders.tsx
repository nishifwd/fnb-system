import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { api, orderDestination, type ServiceOrder } from '../api'
import { OrderItemList } from './OrderItemList'

export function KitchenOrders() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function refresh() { setOrders(await api.orders()) }

  useEffect(() => {
    let active = true
    void api.orders().then((next) => { if (active) setOrders(next) }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Could not load orders.') })
    const timer = window.setInterval(() => { void api.orders().then((next) => { if (active) setOrders(next) }).catch(() => {}) }, 10000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  async function advance(order: ServiceOrder) {
    setBusyId(order.id)
    setError('')
    try {
      const updated = await api.updateOrderStatus(order.id, order.status === 'placed' ? 'preparing' : 'ready')
      setOrders((current) => current.map((entry) => entry.id === updated.id ? updated : entry))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update order.')
      await refresh().catch(() => {})
    } finally { setBusyId(null) }
  }

  return <div className="section-stack">
    <div className="section-heading">
      <div><p className="eyebrow">KITCHEN WORKFLOW</p><h1>Kitchen board</h1></div>
      <p>Orders refresh every 10 seconds. Start preparation, then mark each order ready.</p>
    </div>
    {error && <div className="error-message" role="alert">{error}</div>}
    <div className="service-heading">
      <span>{orders.length} open orders</span>
      <Button variant="secondary" onPress={() => void refresh().catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not refresh.'))}>Refresh</Button>
    </div>
    <div className="kitchen-columns">
      {(['placed', 'preparing', 'ready'] as const).map((status) => {
        const columnOrders = orders.filter((order) => order.status === status)
        const title = status === 'placed' ? 'New' : status === 'preparing' ? 'Preparing' : 'Ready for pickup or service'

        return <section className="panel kitchen-column" key={status}>
          <h2>{title}</h2>
          <div className="order-list">
            {columnOrders.map((order) => <div className="order-card" key={order.id}>
              <div className="order-card-head">
                <div>
                  <strong>#{order.id} · {orderDestination(order)}</strong>
                  <small>{new Date(order.created_at).toLocaleTimeString()}</small>
                </div>
                <span className={`order-status ${status}`}>{status}</span>
              </div>
              <OrderItemList items={order.items} />
              {order.note && <p className="order-note">Order note: {order.note}</p>}
              {status !== 'ready' && <Button isDisabled={busyId === order.id} onPress={() => void advance(order)}>
                {status === 'placed' ? 'Start preparing' : 'Mark ready'}
              </Button>}
            </div>)}
          </div>
          {columnOrders.length === 0 && <p className="column-empty">No orders here.</p>}
        </section>
      })}
    </div>
  </div>
}
