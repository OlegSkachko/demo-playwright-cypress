import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { useNotifications } from '../context/NotificationsContext'

/** Загружает данные заказа(ов) и перезагружает их при каждом WebSocket-событии о заказах. */
export default function useOrders(path) {
  const { subscribe } = useNotifications()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(
    () => api(path).then(setData).catch((e) => setError(e.message)),
    [path]
  )

  useEffect(() => { load() }, [load])
  useEffect(() => subscribe((msg) => { if (msg.type.startsWith('order.')) load() }), [subscribe, load])

  return { data, error }
}
