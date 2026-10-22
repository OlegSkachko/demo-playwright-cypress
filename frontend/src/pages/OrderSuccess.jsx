import { Link, useParams } from 'react-router-dom'
import OrderStatus from '../components/OrderStatus'
import useOrders from '../hooks/useOrders'
import { formatPrice } from '../utils/format'

export default function OrderSuccess() {
  const { orderId } = useParams()
  const { data: order } = useOrders(`/orders/${orderId}/`)

  return (
    <div className="success panel" data-testid="order-success">
      <div className="success__check">✓</div>
      <h1>Заказ оформлен!</h1>
      <p className="muted">Спасибо за покупку. Статус обновляется в реальном времени.</p>
      <div className="success__order">
        Номер заказа: <b data-testid="order-id">{orderId}</b>
      </div>
      {order && (
        <div className="success__meta">
          <OrderStatus status={order.status} label={order.status_label} />
          <span className="muted">Сумма: {formatPrice(order.total)}</span>
        </div>
      )}
      <div className="success__actions">
        <Link to="/orders" className="btn btn--ghost" data-testid="go-to-orders">Мои заказы</Link>
        <Link to="/" className="btn btn--primary" data-testid="continue-shopping">Продолжить покупки</Link>
      </div>
    </div>
  )
}
