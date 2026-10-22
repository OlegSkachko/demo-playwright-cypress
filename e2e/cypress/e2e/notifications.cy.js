describe('WebSocket-уведомления', () => {
  beforeEach(() => {
    cy.resetCart().as('token')
  })

  it('UC-11: гость подключается к уведомлениям', () => {
    cy.visit('/')
    cy.getByTestId('ws-status').should('have.attr', 'data-state', 'open')
    cy.openNotifications().first()
      .should('have.attr', 'data-type', 'welcome')
      .and('contain.text', 'как гость')
  })

  it('UC-12: после входа приходит персональное приветствие', () => {
    cy.visit('/login')
    cy.login()
    cy.waitForPersonalSocket()
  })

  it('UC-13: после покупки статус заказа обновляется в реальном времени', () => {
    cy.visit('/login')
    cy.login()
    cy.waitForPersonalSocket()

    cy.addFirstProductToCart()
    cy.getByTestId('nav-cart').click()
    cy.getByTestId('checkout-button').click()
    cy.getByTestId('address-input').type('Москва, ул. Тестовая, д. 1')
    cy.getByTestId('pay-button').click()

    cy.getByTestId('order-id').invoke('text').then((number) => {
      cy.get('[data-testid="toast"][data-kind="info"]')
        .contains(`Заказ ${number} оформлен`)
        .should('be.visible')
    })

    // Без перезагрузки страницы: paid → assembling → shipped
    cy.getByTestId('order-status', { timeout: 15000 }).should('have.attr', 'data-status', 'assembling')
    cy.getByTestId('order-status', { timeout: 15000 }).should('have.attr', 'data-status', 'shipped')
    cy.getByTestId('order-status').should('have.text', 'Передан в доставку')
  })

  it('UC-14: заказ с другого устройства появляется в «Мои заказы» без перезагрузки', () => {
    cy.visit('/login')
    cy.login()
    cy.waitForPersonalSocket()
    cy.getByTestId('nav-orders').click()

    cy.get('@token').then((token) => cy.createOrderViaApi(token)).then((order) => {
      cy.getByTestId('toast').contains(order.number).should('be.visible')
      cy.get(`[data-testid="order-card"][data-number="${order.number}"]`).should('be.visible')
    })
  })

  // UC-15 есть только в Playwright: у Cypress нет встроенного доступа к WebSocket-фреймам
})
