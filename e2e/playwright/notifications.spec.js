import { test, expect } from '@playwright/test'
import {
  login, addFirstProductToCart, openNotifications, waitForPersonalSocket, resetCart, createOrderViaApi,
} from './helpers'

test.describe('WebSocket-уведомления', () => {
  let token

  test.beforeEach(async ({ request }) => {
    token = await resetCart(request)
  })

  test('UC-11: гость подключается к уведомлениям', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('ws-status')).toHaveAttribute('data-state', 'open')
    const items = await openNotifications(page)
    await expect(items.first()).toHaveAttribute('data-type', 'welcome')
    await expect(items.first()).toContainText('как гость')
  })

  test('UC-12: после входа приходит персональное приветствие', async ({ page }) => {
    await page.goto('/login')
    await login(page)
    await waitForPersonalSocket(page)
  })

  test('UC-13: после покупки статус заказа обновляется в реальном времени', async ({ page }) => {
    test.slow() // склад двигает статусы с задержкой

    await page.goto('/login')
    await login(page)
    await waitForPersonalSocket(page)

    await addFirstProductToCart(page)
    await page.getByTestId('nav-cart').click()
    await page.getByTestId('checkout-button').click()
    await page.getByTestId('address-input').fill('Москва, ул. Тестовая, д. 1')
    await page.getByTestId('pay-button').click()

    const number = await page.getByTestId('order-id').innerText()
    const toasts = page.locator('[data-testid="toast"][data-kind="info"]')
    await expect(toasts.filter({ hasText: `Заказ ${number} оформлен` })).toBeVisible()

    // Без перезагрузки страницы: paid → assembling → shipped
    const status = page.getByTestId('order-status')
    await expect(status).toHaveAttribute('data-status', 'assembling', { timeout: 15_000 })
    await expect(status).toHaveAttribute('data-status', 'shipped', { timeout: 15_000 })
    await expect(status).toHaveText('Передан в доставку')
  })

  test('UC-14: заказ с другого устройства появляется в «Мои заказы» без перезагрузки', async ({ page, request }) => {
    await page.goto('/login')
    await login(page)
    await waitForPersonalSocket(page)
    await page.getByTestId('nav-orders').click()

    const order = await createOrderViaApi(request, token)

    await expect(page.locator(`[data-testid="toast"]`, { hasText: order.number })).toBeVisible()
    await expect(page.locator(`[data-testid="order-card"][data-number="${order.number}"]`)).toBeVisible()
  })

  // ---- Возможность, которой нет в Cypress «из коробки»: прямой доступ к WS-фреймам ----
  test('UC-15 [только Playwright]: сервер шлёт корректный JSON в WebSocket', async ({ page, request }) => {
    // Собираем все входящие сообщения авторизованного сокета
    const frames = []
    page.on('websocket', (ws) => {
      if (!ws.url().includes('token=')) return
      ws.on('framereceived', (f) => frames.push(JSON.parse(f.payload)))
    })

    await page.goto('/login')
    await login(page)

    await expect.poll(() => frames.find((m) => m.type === 'welcome')).toMatchObject({
      data: { authenticated: true },
    })

    const order = await createOrderViaApi(request, token)
    await expect.poll(() => frames.some((m) => m.type === 'order.created')).toBe(true)
    const message = frames.find((m) => m.type === 'order.created')

    expect(message).toMatchObject({
      type: 'order.created',
      data: { number: order.number, status: 'paid', total: order.total },
    })
    expect(Date.parse(message.ts)).not.toBeNaN()
  })
})
