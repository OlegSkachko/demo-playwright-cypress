import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'

export default function Cart() {
  const { isAuthenticated } = useAuth()
  const { lines, subtotal, delivery, total, count, loading, add, decrement, remove } = useCart()
  const navigate = useNavigate()

  if (loading && !lines.length) {
    return <div className="empty"><span className="spinner spinner--lg" /></div>
  }

  if (!lines.length) {
    return (
      <div className="empty" data-testid="cart-empty">
        <div className="empty__icon">🛒</div>
        <h2>Корзина пуста</h2>
        <p className="muted">Добавьте что-нибудь красивое из каталога</p>
        <Link to="/" className="btn btn--primary">Перейти в каталог</Link>
      </div>
    )
  }

  return (
    <div className="cart">
      <section className="cart__list">
        <h1 className="page-title">Корзина <span className="muted">· {count} шт.</span></h1>
        {lines.map(({ product, qty }) => (
          <div className="cart-item panel" key={product.id} data-testid="cart-item">
            <div className="cart-item__thumb" style={{ background: product.gradient }}>
              {product.emoji}
            </div>
            <div className="cart-item__info">
              <div className="cart-item__title" data-testid="cart-item-title">{product.title}</div>
              <div className="muted">{formatPrice(product.price)}</div>
            </div>
            <div className="qty">
              <button onClick={() => decrement(product.id)} data-testid="qty-decrement">−</button>
              <span data-testid="qty-value">{qty}</span>
              <button onClick={() => add(product.id)} data-testid="qty-increment">+</button>
            </div>
            <div className="cart-item__sum">{formatPrice(product.price * qty)}</div>
            <button className="icon-btn" onClick={() => remove(product.id)} title="Удалить" data-testid="remove-item">
              ✕
            </button>
          </div>
        ))}
      </section>

      <aside className="panel summary">
        <h2>Итого</h2>
        <div className="summary__row"><span>Товары ({count})</span><span>{formatPrice(subtotal)}</span></div>
        <div className="summary__row">
          <span>Доставка</span>
          <span className={delivery ? '' : 'accent'}>{delivery ? formatPrice(delivery) : 'Бесплатно'}</span>
        </div>
        <div className="summary__total">
          <span>К оплате</span>
          <span data-testid="cart-total">{formatPrice(total)}</span>
        </div>

        {isAuthenticated ? (
          <button className="btn btn--primary btn--block" onClick={() => navigate('/checkout')} data-testid="checkout-button">
            Оформить заказ
          </button>
        ) : (
          <>
            <div className="alert alert--lock" data-testid="auth-required">
              🔒 Оформить заказ могут только авторизованные пользователи
            </div>
            <button className="btn btn--primary btn--block" disabled data-testid="checkout-button">
              Оформить заказ
            </button>
            <Link to="/login?from=/cart" className="btn btn--ghost btn--block" data-testid="login-to-buy">
              Войти, чтобы купить
            </Link>
          </>
        )}
      </aside>
    </div>
  )
}
