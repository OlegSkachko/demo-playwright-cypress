import 'cypress-mochawesome-reporter/register'

// Cypress 16: Cypress.env() удалён, секреты читаются асинхронно через cy.env()
const credentials = () =>
  cy.env(['TEST_USER_EMAIL', 'TEST_USER_PASSWORD'], { log: false })
    .then(({ TEST_USER_EMAIL, TEST_USER_PASSWORD }) => ({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }))

// ---------- UI ----------

Cypress.Commands.add('getByTestId', (id, options) => cy.get(`[data-testid="${id}"]`, options))

// На проде логин/пароль тестового аккаунта передаются через переменные окружения
Cypress.Commands.add('login', (email, password) => {
  credentials().then((user) => {
    cy.getByTestId('email-input').type(email ?? user.email)
    cy.getByTestId('password-input').type(password ?? user.password, { log: false })
    cy.getByTestId('login-submit').click()
  })
})

Cypress.Commands.add('addFirstProductToCart', () => {
  cy.getByTestId('product-card').first().within(() => {
    // type: 'static' — иначе Cypress 12+ при обращении к алиасу заново ищет элемент в DOM
    cy.getByTestId('product-title').invoke('text').as('productTitle', { type: 'static' })
    cy.getByTestId('add-to-cart').click()
  })
  cy.getByTestId('cart-count').should('have.text', '1')
})

Cypress.Commands.add('openNotifications', () => {
  cy.getByTestId('notification-bell').click()
  cy.getByTestId('notification-panel').should('be.visible')
  return cy.getByTestId('notification-item')
})

/** Ждём, пока WebSocket переподключится уже с токеном пользователя */
Cypress.Commands.add('waitForPersonalSocket', () => {
  cy.getByTestId('ws-status').should('have.attr', 'data-state', 'open')
  cy.openNotifications().contains('вы подключены к уведомлениям').should('be.visible')
  cy.getByTestId('notification-bell').click()
})

// ---------- API (подготовка данных, без UI) ----------

Cypress.Commands.add('apiLogin', () =>
  credentials().then((body) => cy.request('POST', '/api/auth/login/', body)).its('body.token')
)

/** Очищаем серверную корзину тестового пользователя — тесты не зависят от прошлых прогонов */
Cypress.Commands.add('resetCart', () =>
  cy.apiLogin().then((token) =>
    cy.request({ method: 'DELETE', url: '/api/cart/', headers: { Authorization: `Token ${token}` } })
      .then(() => token)
  )
)

/** Заказ «с другого устройства»: напрямую через API */
Cypress.Commands.add('createOrderViaApi', (token) => {
  const headers = { Authorization: `Token ${token}` }
  return cy.request('/api/products/').its('body.0.id').then((productId) =>
    cy.request({ method: 'POST', url: '/api/cart/items/', headers, body: { product_id: productId } })
      .then(() => cy.request({ method: 'POST', url: '/api/orders/', headers, body: { address: 'Заказ через API' } }))
      .then((res) => {
        expect(res.status).to.eq(201)
        return res.body
      })
  )
})
