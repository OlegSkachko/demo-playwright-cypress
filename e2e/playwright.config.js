import { defineConfig, devices } from '@playwright/test'

// По умолчанию — локальный docker compose. На проде: BASE_URL=https://shop.example.com npm run pw
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080'

export default defineConfig({
  testDir: './playwright',
  outputDir: './test-results/playwright',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  // Все авторизованные сценарии работают под одним тестовым аккаунтом (его корзина общая),
  // поэтому гоняем последовательно — так же, как Cypress
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
