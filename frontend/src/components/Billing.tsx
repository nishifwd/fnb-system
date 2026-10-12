import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@heroui/react'
import { ApiError, api, preparationLabel, type BillingDetail, type BillingHistory, type PaymentMethod } from '../api'

type Filter = 'all' | 'unpaid' | 'paid'
type CheckoutMethod = Exclude<PaymentMethod, 'e_wallet'>

function paymentLabel(method: PaymentMethod | null): string {
  if (method === 'e_wallet') return 'E-wallet'
  if (method === 'qr') return 'QR payment'
  return method ? method[0].toUpperCase() + method.slice(1) : 'Unpaid'
}

function Receipt({ detail }: { detail: BillingDetail }) {
  const { order, bill } = detail

  return <article className="receipt-sheet">
    <header>
      <h1>{bill.business.name}</h1>
      {bill.business.address && <p>{bill.business.address}</p>}
      {bill.business.phone && <p>{bill.business.phone}</p>}
      <h2>Receipt {bill.number}</h2>
      <p>{bill.destination} · Order #{order.id}</p>
      <p>{bill.paid_at ? new Date(bill.paid_at).toLocaleString() : 'Payment pending'}</p>
    </header>
    <div className="receipt-lines">
      {order.items.map((item) => <div key={item.id}>
        <div className="receipt-row"><span>{item.quantity} × {item.name}</span><strong>{bill.currency} {item.line_total}</strong></div>
        {item.preparation && <small>{preparationLabel(item.preparation)}</small>}
        {item.remark && <small>Remark: {item.remark}</small>}
      </div>)}
    </div>
    <div className="receipt-totals">
      <div className="receipt-row"><span>Subtotal</span><span>{bill.currency} {bill.subtotal}</span></div>
      {Number(bill.discount_amount) > 0 && <div className="receipt-row"><span>Discount</span><span>− {bill.currency} {bill.discount_amount}</span></div>}
      {Number(bill.service_charge_amount) > 0 && <div className="receipt-row"><span>Service charge ({bill.service_charge_rate}%)</span><span>{bill.currency} {bill.service_charge_amount}</span></div>}
      {Number(bill.tax_amount) > 0 && <div className="receipt-row"><span>Tax ({bill.tax_rate}%)</span><span>{bill.currency} {bill.tax_amount}</span></div>}
      <div className="receipt-row receipt-grand"><strong>Total</strong><strong>{bill.currency} {bill.grand_total}</strong></div>
    </div>
    <footer>{bill.paid_at ? `Paid by ${paymentLabel(bill.payment_method)}${bill.payment_reference ? ` · Ref: ${bill.payment_reference}` : ''} · Thank you` : 'Payment pending'}</footer>
  </article>
}

export function Billing() {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [history, setHistory] = useState<BillingHistory | null>(null)
  const [selected, setSelected] = useState<BillingDetail | null>(null)
  const [discount, setDiscount] = useState('0')
  const [method, setMethod] = useState<CheckoutMethod>('cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [confirmedPayment, setConfirmedPayment] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    void api.billingOrders(filter, page).then((result) => {
      if (active) setHistory(result)
    }).catch((caught) => {
      if (active) setError(caught instanceof Error ? caught.message : 'Could not load order history.')
    })
    return () => { active = false }
  }, [filter, page])

  async function refreshHistory() {
    setHistory(await api.billingOrders(filter, page))
  }

  async function openOrder(id: number) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const detail = await api.billingOrder(id)
      setSelected(detail)
      setDiscount(detail.bill.discount_amount)
      setMethod('cash')
      setPaymentReference('')
      setConfirmedPayment(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not open the bill.')
    } finally { setBusy(false) }
  }

  async function previewBill() {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      setSelected(await api.billingOrder(selected.order.id, discount))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not preview the bill.')
    } finally { setBusy(false) }
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || Number(discount) !== Number(selected.bill.discount_amount)) return
    if (method !== 'cash' && !confirmedPayment) return
    if (!window.confirm(`Record ${selected.bill.currency} ${selected.bill.grand_total} by ${paymentLabel(method)} for order #${selected.order.id}?`)) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const detail = await api.payOrder(selected.order.id, method, discount, selected.bill.grand_total, paymentReference.trim() || null)
      setSelected(detail)
      await refreshHistory()
      setMessage(`Payment recorded. Receipt ${detail.bill.number} is ready to print.`)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        try {
          setSelected(await api.billingOrder(selected.order.id, discount))
          setConfirmedPayment(false)
        } catch {
          // Keep the payment error visible if the refreshed bill cannot load.
        }
      }
      setError(caught instanceof Error ? caught.message : 'Could not record payment.')
    } finally { setBusy(false) }
  }

  function changeFilter(next: Filter) {
    if (next === filter && page === 1) return
    setFilter(next)
    setPage(1)
    setSelected(null)
    setHistory(null)
    setError('')
  }

  return <div className="section-stack">
    <div className="section-heading"><div><p className="eyebrow">CHECKOUT</p><h1>Billing & history</h1></div><p>Find an order, record its payment, and print its receipt.</p></div>
    {error && <div className="notice error-message" role="alert">{error}</div>}
    {message && <div className="notice success-message" role="status">{message}</div>}
    <div className="billing-grid">
      <section className="panel billing-history">
        <div className="panel-heading"><h2>Orders</h2><span className="count">{history?.total ?? 0}</span></div>
        <div className="service-mode-tabs" role="group" aria-label="Payment filter">
          {(['all', 'unpaid', 'paid'] as const).map((choice) => <button key={choice} type="button" className={filter === choice ? 'active' : ''} onClick={() => changeFilter(choice)}>{choice[0].toUpperCase() + choice.slice(1)}</button>)}
        </div>
        {!history && !error && <p>Loading orders…</p>}
        {history?.orders.length === 0 && <p className="empty-note">No orders in this view.</p>}
        <div className="billing-order-list">
          {history?.orders.map((order) => <button type="button" key={order.id} className={`billing-order${selected?.order.id === order.id ? ' active' : ''}`} onClick={() => void openOrder(order.id)} disabled={busy}>
            <span><strong>#{order.id} · {order.order_type === 'takeaway' ? `Takeaway${order.pickup_name ? ` · ${order.pickup_name}` : ''}` : `Table ${order.table_label ?? '?'}`}</strong><small>{new Date(order.created_at).toLocaleString()} · {order.status}</small></span>
            <span><strong>{order.currency} {order.grand_total ?? order.total}</strong><small>{order.paid_at ? 'Paid' : 'Unpaid'}</small></span>
          </button>)}
        </div>
        {history && history.pages > 1 && <div className="billing-pages">
          <Button variant="secondary" isDisabled={page <= 1} onPress={() => { setPage((value) => value - 1); setHistory(null) }}>Previous</Button>
          <span>Page {page} of {history.pages}</span>
          <Button variant="secondary" isDisabled={page >= history.pages} onPress={() => { setPage((value) => value + 1); setHistory(null) }}>Next</Button>
        </div>}
      </section>
      <section className="panel billing-detail">
        {!selected && <div className="billing-empty"><h2>Select an order</h2><p>Choose any order, including one already served, to review its bill.</p></div>}
        {selected && <>
          <div className="panel-heading"><h2>Order #{selected.order.id}</h2><span className={`order-status ${selected.order.status}`}>{selected.order.status}</span></div>
          <Receipt detail={selected} />
          {!selected.bill.paid_at ? <form className="billing-checkout" onSubmit={(event) => void recordPayment(event)}>
            <label className="field">Discount ({selected.bill.currency})<input type="number" min="0" max={selected.bill.subtotal} step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} required /></label>
            <label className="field">Payment method<select value={method} onChange={(event) => { setMethod(event.target.value as CheckoutMethod); setConfirmedPayment(false) }}><option value="cash">Cash</option><option value="card">Card terminal</option><option value="qr">QR payment</option></select></label>
            {method === 'qr' && <div className="payment-instructions">
              {selected.bill.payment_qr_available ? <img src="/api/v1/business/payment-qr" alt="Scan this business payment QR" /> : <p>Use the business's bank-issued QR standee. An owner can upload it in Business settings to show it here.</p>}
              <strong>Ask the customer to pay {selected.bill.currency} {selected.bill.grand_total}.</strong>
              <p>Verify the payment in the provider app before recording it.</p>
            </div>}
            {method === 'card' && <p className="payment-instructions">Charge {selected.bill.currency} {selected.bill.grand_total} on the card terminal, then verify its approved result before recording payment.</p>}
            {method !== 'cash' && <>
              <label className="field billing-reference">Transaction reference (optional)<input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} maxLength={100} placeholder="From terminal or bank app" /></label>
              <label className="billing-confirm"><input type="checkbox" checked={confirmedPayment} onChange={(event) => setConfirmedPayment(event.target.checked)} required /> I verified the payment in the terminal or provider app.</label>
            </>}
            <div className="billing-actions"><Button type="button" variant="secondary" isDisabled={busy} onPress={() => void previewBill()}>Preview total</Button><Button type="submit" isDisabled={busy || Number(discount) !== Number(selected.bill.discount_amount) || (method !== 'cash' && !confirmedPayment)}>Record payment</Button></div>
          </form> : <div className="billing-actions"><Button isDisabled={busy} onPress={() => window.print()}>Print receipt</Button></div>}
        </>}
      </section>
    </div>
    {selected?.bill.paid_at && createPortal(<div className="receipt-print"><Receipt detail={selected} /></div>, document.body)}
  </div>
}
