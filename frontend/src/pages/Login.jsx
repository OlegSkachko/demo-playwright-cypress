import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const DEMO_USERS = [
  { email: 'demo@lumen.shop', password: 'demo123', label: 'Анна' },
  { email: 'ivan@lumen.shop', password: 'ivan123', label: 'Иван' },
]

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated && !loading) return <Navigate to={from} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      notify(`Добро пожаловать, ${user.name}!`)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <form className="panel auth__panel" onSubmit={handleSubmit} data-testid="login-form">
        <div className="auth__icon">✦</div>
        <h1 className="auth__title">Вход в Lumen</h1>
        <p className="muted">Войдите, чтобы оформлять заказы</p>

        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email-input"
          />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            className="input"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="password-input"
          />
        </label>

        {error && <div className="alert alert--error" data-testid="login-error">{error}</div>}

        <button className="btn btn--primary btn--block" disabled={loading} data-testid="login-submit">
          {loading ? <span className="spinner" /> : 'Войти'}
        </button>

        <div className="demo-hint">
          <b>Демо-доступ</b>
          {DEMO_USERS.map((u) => (
            <div className="demo-hint__row" key={u.email}>
              <span>{u.email} / {u.password}</span>
              <button
                type="button"
                className="link-btn"
                onClick={() => { setEmail(u.email); setPassword(u.password) }}
              >
                {u.label}
              </button>
            </div>
          ))}
        </div>
      </form>
    </div>
  )
}
