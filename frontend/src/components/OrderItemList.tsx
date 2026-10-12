import { preparationLabel, type OrderLine } from '../api'

export function OrderItemList({ items }: { items: OrderLine[] }) {
  return <div className="order-item-list">
    {items.map((item) => <div key={item.id}>
      <strong>{item.quantity} × {item.name}</strong>
      {item.preparation && <small>{preparationLabel(item.preparation)}</small>}
      {item.remark && <p className="order-item-remark">Remark: {item.remark}</p>}
    </div>)}
  </div>
}
