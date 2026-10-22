import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { deliveryFor } from '../utils/format'
import { useAuth } from './AuthContext'
import { useNotifications } from './NotificationsContext'
import { useProducts } from './ProductsContext'
import { readGuestCart, writeGuestCart } from './guestCart'

const CartContext = createContext(null)

/**
 * Гость — корзина в localStorage.
 * Авторизованный пользователь — корзина на сервере (таблица CartItem).
 */
export function CartProvider({ children }) {
  const { token } = useAuth()
  const { products } = useProducts()
  const { subscribe } = useNotifications()
  const [guestItems, setGuestItems] = useState(readGuestCart)
  const [serverCart, setServerCart] = useState(null)
  const [loading, setLoading] = useState(!!token)

  useEffect(() => {
    if (!token) writeGuestCart(guestItems)
  }, [guestItems, token])

  const reload = useCallback(() => {
    setLoading(true)
    return api('/cart/')
      .then(setServerCart)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (token) {
      setGuestItems({})
      reload()
    } else {
      setServerCart(null)
      setLoading(false)
    }
  }, [token, reload])

  // Заказ оформлен с другого устройства/вкладки — серверная корзина уже пуста
  useEffect(
    () => subscribe((msg) => { if (token && msg.type === 'order.created') reload() }),
    [subscribe, token, reload]
  )

  const lines = useMemo(() => {
    if (token) return (serverCart?.items || []).map((i) => ({ product: i.product, qty: i.quantity }))
    return Object.entries(guestItems)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
      .filter((l) => l.product)
  }, [token, serverCart, guestItems, products])

  const quantityOf = (id) => lines.find((l) => l.product.id === id)?.qty || 0

  const add = async (id) => {
    if (token) return setServerCart(await api('/cart/items/', { method: 'POST', body: { product_id: id } }))
    setGuestItems((s) => ({ ...s, [id]: (s[id] || 0) + 1 }))
  }

  const setQuantity = async (id, qty) => {
    if (token) {
      const method = qty > 0 ? 'PATCH' : 'DELETE'
      return setServerCart(await api(`/cart/items/${id}/`, { method, body: qty > 0 ? { quantity: qty } : undefined }))
    }
    setGuestItems((s) => {
      const next = { ...s }
      if (qty > 0) next[id] = qty
      else delete next[id]
      return next
    })
  }

  const decrement = (id) => setQuantity(id, quantityOf(id) - 1)
  const remove = (id) => setQuantity(id, 0)

  const count = lines.reduce((sum, l) => sum + l.qty, 0)
  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.product.price, 0)
  const delivery = deliveryFor(subtotal)

  return (
    <CartContext.Provider
      value={{ lines, count, subtotal, delivery, total: subtotal + delivery, loading, add, decrement, remove, reload }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
