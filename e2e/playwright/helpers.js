import { expect } from '@playwright/test'

// На проде логин/пароль тестового аккаунта передаются через переменные окружения
export const USER = {
  email: process.env.TEST_USER_EMAIL || 'qa@lumen.shop',
  password: process.env.TEST_USER_PASSWORD || 'qa12345',
}

// ---------- UI ----------

export async function login(page, { email, password } = USER) {
  await page.getByTestId('email-input').fill(email)
  await page.getByTestId('password-input').fill(password)
  await page.getByTestId('login-submit').click()
}

export async function addFirstProductToCart(page) {
  const card = page.getByTestId('product-card').first()
  const title = await card.getByTestId('product-title').innerText()
  await card.getByTestId('add-to-cart').click()
  await expect(page.getByTestId('cart-count')).toHaveText('1')
  return title
}

export async function openNotifications(page) {
  await page.getByTestId('notification-bell').click()
  await expect(page.getByTestId('notification-panel')).toBeVisible()
  return page.getByTestId('notification-item')
}

/** Ждём, пока WebSocket переподключится уже с токеном пользователя */
export async function waitForPersonalSocket(page) {
  await expect(page.getByTestId('ws-status')).toHaveAttribute('data-state', 'open')
  const items = await openNotifications(page)
  await expect(items.filter({ hasText: 'вы подключены к уведомлениям' }).first()).toBeVisible()
  await page.getByTestId('notification-bell').click()
}

// ---------- API (подготовка данных, без UI) ----------

export async function apiLogin(request) {
  const res = await request.post('/api/auth/login/', { data: USER })
  expect(res.ok()).toBeTruthy()
  return (await res.json()).token
}

/** Очищаем серверную корзину тестового пользователя — тесты не зависят от прошлых прогонов */
export async function resetCart(request) {
  const token = await apiLogin(request)
  const res = await request.delete('/api/cart/', { headers: { Authorization: `Token ${token}` } })
  expect(res.ok()).toBeTruthy()
  return token
}

/** Заказ «с другого устройства»: напрямую через API */
export async function createOrderViaApi(request, token) {
  const headers = { Authorization: `Token ${token}` }
  const products = await (await request.get('/api/products/')).json()
  await request.post('/api/cart/items/', { headers, data: { product_id: products[0].id } })
  const res = await request.post('/api/orders/', { headers, data: { address: 'Заказ через API' } })
  expect(res.status()).toBe(201)
  return res.json()
}
