import { test, expect } from '@playwright/test'
import { USER, login, addFirstProductToCart, resetCart } from './helpers'

test.describe('Авторизация и покупка', () => {
  test.beforeEach(async ({ request }) => {
    await resetCart(request)
  })

  test('UC-06: неверный пароль показывает ошибку', async ({ page }) => {
    await page.goto('/login')
    await login(page, { email: USER.email, password: 'wrong-password' })
    await expect(page.getByTestId('login-error')).toHaveText('Неверный email или пароль')
    await expect(page).toHaveURL(/\/login/)
  })

  test('UC-07: успешный вход показывает пользователя в шапке', async ({ page }) => {
    await page.goto('/login')
    await login(page)
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('user-name')).toBeVisible()
    await expect(page.getByTestId('login-link')).toHaveCount(0)
  })

  test('UC-08: вход из корзины переносит гостевую корзину и разблокирует покупку', async ({ page }) => {
    await page.goto('/')
    const title = await addFirstProductToCart(page)
    await page.getByTestId('nav-cart').click()
    await page.getByTestId('login-to-buy').click()
    await login(page)

    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByTestId('cart-item-title')).toHaveText(title)
    await expect(page.getByTestId('auth-required')).toHaveCount(0)
    await expect(page.getByTestId('checkout-button')).toBeEnabled()
  })

  test('UC-09: авторизованный пользователь покупает товар', async ({ page }) => {
    await page.goto('/login')
    await login(page)
    await expect(page.getByTestId('user-name')).toBeVisible()

    await addFirstProductToCart(page)
    await page.getByTestId('nav-cart').click()
    await page.getByTestId('checkout-button').click()

    await expect(page).toHaveURL(/\/checkout$/)
    await page.getByTestId('address-input').fill('Москва, ул. Тестовая, д. 1')
    await page.getByTestId('pay-button').click()

    await expect(page.getByTestId('order-success')).toBeVisible()
    const orderId = page.getByTestId('order-id')
    await expect(orderId).toHaveText(/^LM-\d{6}$/)
    await expect(page.getByTestId('cart-count')).toHaveCount(0)

    // Заказ появился в истории покупок
    const number = await orderId.innerText()
    await page.getByTestId('go-to-orders').click()
    await expect(page.getByTestId('order-number').first()).toHaveText(number)
  })

  test('UC-10: после выхода покупка снова заблокирована', async ({ page }) => {
    await page.goto('/login')
    await login(page)
    await page.getByTestId('logout-button').click()
    await expect(page.getByTestId('login-link')).toBeVisible()

    await addFirstProductToCart(page)
    await page.getByTestId('nav-cart').click()
    await expect(page.getByTestId('checkout-button')).toBeDisabled()
  })
})
