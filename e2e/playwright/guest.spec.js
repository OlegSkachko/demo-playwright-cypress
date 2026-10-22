import { test, expect } from '@playwright/test'
import { addFirstProductToCart } from './helpers'

test.describe('Неавторизованный пользователь', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('UC-01: видит каталог товаров и кнопку входа', async ({ page }) => {
    const cards = page.getByTestId('product-card')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThan(0)
    await expect(page.getByTestId('login-link')).toBeVisible()
    await expect(page.getByTestId('user-chip')).toHaveCount(0)
  })

  test('UC-02: ищет и фильтрует товары', async ({ page }) => {
    await page.getByTestId('search-input').fill('наушники')
    await expect(page.getByTestId('product-card')).toHaveCount(1)
    await expect(page.getByTestId('product-title')).toHaveText('Наушники Aura Pro')

    await page.getByTestId('search-input').fill('несуществующий товар')
    await expect(page.getByTestId('empty-search')).toBeVisible()

    await page.getByTestId('search-input').fill('')
    await page.getByTestId('filter-Дом').click()
    const categories = page.getByTestId('product-category')
    await expect(categories.first()).toBeVisible()
    for (const chip of await categories.all()) await expect(chip).toHaveText('Дом')
  })

  test('UC-03: добавляет товар в корзину', async ({ page }) => {
    const title = await addFirstProductToCart(page)
    await page.getByTestId('nav-cart').click()
    await expect(page.getByTestId('cart-item')).toHaveCount(1)
    await expect(page.getByTestId('cart-item-title')).toHaveText(title)

    await page.getByTestId('qty-increment').click()
    await expect(page.getByTestId('qty-value')).toHaveText('2')
    await expect(page.getByTestId('cart-count')).toHaveText('2')
  })

  test('UC-04: не может оформить заказ из корзины', async ({ page }) => {
    await addFirstProductToCart(page)
    await page.getByTestId('nav-cart').click()
    await expect(page.getByTestId('auth-required')).toBeVisible()
    await expect(page.getByTestId('checkout-button')).toBeDisabled()
    await expect(page.getByTestId('login-to-buy')).toBeVisible()
  })

  test('UC-05: при прямом переходе на /checkout попадает на страницу входа', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByTestId('login-form')).toBeVisible()
  })
})
