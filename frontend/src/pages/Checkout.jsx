import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'

export default function Checkout() {
  const { user } = useAuth()
  const { lines, delivery, total, loading: cartLoading, reload } = useCart()
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [card, setCard] = useState('4242 4242 4242 4242')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  if (!lines.length && !paying && !cartLoading) return <Navigate to="/cart" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPaying(true)
    try {
      await new Promise((r) => setTimeout(r, 800)) // имитация платёжного шлюза
      const order = await api('/orders/', { method: 'POST', body: { address } })
      await reload()
      navigate(`/success/${order.number}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setPaying(false)
    }
  }

  return (
    <div className="checkout">
      <form className="panel checkout__form" onSubmit={handleSubmit} data-testid="checkout-form">
        <h1 className="page-title">Оформление заказа</h1>
        <label className="field">
          <span>Получатель</span>
          <input className="input" value={user?.name || ''} readOnly data-testid="checkout-name" />
        </label>
        <label className="field">
          <span>Адрес доставки</span>
          <input
            className="input"
            required
            placeholder="Город, улица, дом, квартира"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            data-testid="address-input"
          />
        </label>
        <label className="field">
          <span>Карта (тестовая)</span>
          <input
            className="input"
            required
            value={card}
            onChange={(e) => setCard(e.target.value)}
            data-testid="card-input"
          />
        </label>
        {error && <div className="alert alert--error" data-testid="checkout-error">{error}</div>}
        <button className="btn btn--primary btn--block" disabled={paying} data-testid="pay-button">
          {paying ? <span className="spinner" /> : `Оплатить ${formatPrice(total)}`}
        </button>
        <p className="muted small">Это демо — реальные деньги не списываются.</p>
      </form>

      <aside className="panel summary">
        <h2>Ваш заказ</h2>
        {lines.map(({ product, qty }) => (
          <div className="summary__row" key={product.id}>
            <span>{product.emoji} {product.title} × {qty}</span>
            <span>{formatPrice(product.price * qty)}</span>
          </div>
        ))}
        <div className="summary__row"><span>Доставка</span><span>{delivery ? formatPrice(delivery) : 'Бесплатно'}</span></div>
        <div className="summary__total">
          <span>Итого</span>
          <span data-testid="checkout-total">{formatPrice(total)}</span>
        </div>
      </aside>
    </div>
  )
}
