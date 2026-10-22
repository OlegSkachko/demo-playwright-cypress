import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const NotificationsContext = createContext(null)
const RECONNECT_DELAY = 2000

/**
 * Одно WebSocket-соединение на вкладку. Гость получает общие рассылки,
 * авторизованный пользователь — ещё и личные уведомления о заказах.
 */
export function NotificationsProvider({ children }) {
  const { token } = useAuth()
  const notify = useToast()
  const [status, setStatus] = useState('connecting')
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const listeners = useRef(new Set())

  useEffect(() => {
    let ws
    let retryTimer
    let disposed = false
    setItems([])
    setUnread(0)

    const connect = () => {
      setStatus('connecting')
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const query = token ? `?token=${encodeURIComponent(token)}` : ''
      ws = new WebSocket(`${proto}://${window.location.host}/ws/notifications/${query}`)

      ws.onopen = () => setStatus('open')
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === 'pong') return
        setItems((list) => [{ ...msg, id: Math.random().toString(36).slice(2) }, ...list].slice(0, 20))
        setUnread((n) => n + 1)
        if (msg.type !== 'welcome') notify(msg.text, 'info')
        listeners.current.forEach((fn) => fn(msg))
      }
      ws.onclose = () => {
        if (disposed) return
        setStatus('closed')
        retryTimer = setTimeout(connect, RECONNECT_DELAY)
      }
    }

    connect()
    return () => {
      disposed = true
      clearTimeout(retryTimer)
      ws?.close()
    }
  }, [token, notify])

  const subscribe = useCallback((fn) => {
    listeners.current.add(fn)
    return () => listeners.current.delete(fn)
  }, [])

  const markAllRead = useCallback(() => setUnread(0), [])

  return (
    <NotificationsContext.Provider value={{ status, items, unread, subscribe, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
