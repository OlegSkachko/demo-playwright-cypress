import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import NotificationBell from './NotificationBell'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { count } = useCart()
  const notify = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    notify('Вы вышли из аккаунта')
    navigate('/')
  }

  const initials = user?.name.split(' ').map((w) => w[0]).join('').slice(0, 2)

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="logo" data-testid="logo">
          <span className="logo__mark">✦</span> Lumen
        </Link>

        <nav className="nav">
          <NavLink to="/" end className="nav__link" data-testid="nav-catalog">Каталог</NavLink>
          <NavLink to="/cart" className="nav__link cart-link" data-testid="nav-cart">
            <span aria-hidden>🛒</span> Корзина
            {count > 0 && <span className="cart-badge" data-testid="cart-count">{count}</span>}
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className="nav__link" data-testid="nav-orders">Мои заказы</NavLink>
          )}
        </nav>

        <div className="header__auth">
          <NotificationBell />
          {isAuthenticated ? (
            <>
              <div className="user-chip" data-testid="user-chip">
                <span className="avatar">{initials}</span>
                <span className="user-chip__name" data-testid="user-name">{user?.name}</span>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={handleLogout} data-testid="logout-button">
                Выйти
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn--primary btn--sm" data-testid="login-link">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
