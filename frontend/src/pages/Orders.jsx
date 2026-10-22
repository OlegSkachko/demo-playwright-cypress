import { Link } from 'react-router-dom'
import OrderStatus from '../components/OrderStatus'
import useOrders from '../hooks/useOrders'
import { formatDate, formatPrice } from '../utils/format'

export default function Orders() {
  const { data: orders, error } = useOrders('/orders/')

  if (error) return <div className="empty"><p>{error}</p></div>
  if (!orders) return <div className="empty"><span className="spinner spinner--lg" /></div>

  if (!orders.length) {
    return (
      <div className="empty" data-testid="orders-empty">
        <div className="empty__icon">🧾</div>
        <h2>Заказов пока нет</h2>
        <Link to="/" className="btn btn--primary">Перейти в каталог</Link>
      </div>
    )
  }

  return (
    <div className="orders">
      <h1 className="page-title">Мои заказы</h1>
      {orders.map((o) => (
        <article className="panel order" key={o.number} data-testid="order-card" data-number={o.number}>
          <div className="order__head">
            <div>
              <div className="order__number" data-testid="order-number">{o.number}</div>
              <div className="muted small">{formatDate(o.created_at)} · {o.address}</div>
            </div>
            <OrderStatus status={o.status} label={o.status_label} />
          </div>
          <div className="order__items">
            {o.items.map((i) => (
              <span className="order__item" key={i.product}>{i.emoji} {i.title} × {i.quantity}</span>
            ))}
          </div>
          <div className="order__total">Итого: <b>{formatPrice(o.total)}</b></div>
        </article>
      ))}
    </div>
  )
}
