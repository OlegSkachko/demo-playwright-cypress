const { defineConfig } = require('cypress')

// По умолчанию — локальный docker compose. На проде: BASE_URL=https://shop.example.com npm run cy
module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'reports/cypress',
    reportPageTitle: 'Cypress — Lumen Store',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },
  screenshotsFolder: 'test-results/cypress/screenshots',
  videosFolder: 'test-results/cypress/videos',
  video: false,
  defaultCommandTimeout: 7000,
  retries: { runMode: process.env.CI ? 1 : 0, openMode: 0 },
  env: {
    TEST_USER_EMAIL: process.env.TEST_USER_EMAIL || 'qa@lumen.shop',
    TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD || 'qa12345',
  },
  e2e: {
    baseUrl: process.env.BASE_URL || 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on)
      return config
    },
  },
})
