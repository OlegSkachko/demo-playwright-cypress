// Корзина гостя живёт в localStorage: { [productId]: quantity }
const KEY = 'lumen.guestCart'

export const readGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

export const writeGuestCart = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* приватный режим — живём без сохранения */
  }
}
