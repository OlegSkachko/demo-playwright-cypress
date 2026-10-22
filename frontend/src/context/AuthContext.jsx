import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api'
import { readGuestCart, writeGuestCart } from './guestCart'

const USER_KEY = 'lumen.user'
const AuthContext = createContext(null)

const readUser = () => {
  try {
    return getToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)
  const [token, setTokenState] = useState(getToken)

  const resetSession = () => {
    setToken(null)
    localStorage.removeItem(USER_KEY)
    setTokenState(null)
    setUser(null)
  }

  useEffect(() => {
    window.addEventListener('lumen:session-expired', resetSession)
    if (getToken()) {
      api('/auth/me/')
        .then((me) => {
          localStorage.setItem(USER_KEY, JSON.stringify(me))
          setUser(me)
        })
        .catch(() => {})
    }
    return () => window.removeEventListener('lumen:session-expired', resetSession)
  }, [])

  const login = async (email, password) => {
    const data = await api('/auth/login/', { method: 'POST', body: { email, password } })
    setToken(data.token)

    // Переносим гостевую корзину в аккаунт до того, как интерфейс переключится на серверную
    const guest = Object.entries(readGuestCart()).map(([id, quantity]) => ({ product_id: Number(id), quantity }))
    if (guest.length) await api('/cart/merge/', { method: 'POST', body: { items: guest } })
    writeGuestCart({})

    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setTokenState(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await api('/auth/logout/', { method: 'POST' }).catch(() => {})
    resetSession()
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
