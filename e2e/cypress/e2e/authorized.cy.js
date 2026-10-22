describe('Авторизация и покупка', () => {
  beforeEach(() => {
    cy.resetCart()
  })

  it('UC-06: неверный пароль показывает ошибку', () => {
    cy.visit('/login')
    cy.login(undefined, 'wrong-password')
    cy.getByTestId('login-error').should('have.text', 'Неверный email или пароль')
    cy.location('pathname').should('eq', '/login')
  })

  it('UC-07: успешный вход показывает пользователя в шапке', () => {
    cy.visit('/login')
    cy.login()
    cy.location('pathname').should('eq', '/')
    cy.getByTestId('user-name').should('be.visible')
    cy.getByTestId('login-link').should('not.exist')
  })

  it('UC-08: вход из корзины переносит гостевую корзину и разблокирует покупку', () => {
    cy.visit('/')
    cy.addFirstProductToCart()
    cy.getByTestId('nav-cart').click()
    cy.getByTestId('login-to-buy').click()
    cy.login()

    cy.location('pathname').should('eq', '/cart')
    cy.get('@productTitle').then((title) => {
      cy.getByTestId('cart-item-title').should('have.text', title)
    })
    cy.getByTestId('auth-required').should('not.exist')
    cy.getByTestId('checkout-button').should('be.enabled')
  })

  it('UC-09: авторизованный пользователь покупает товар', () => {
    cy.visit('/login')
    cy.login()
    cy.getByTestId('user-name').should('be.visible')

    cy.addFirstProductToCart()
    cy.getByTestId('nav-cart').click()
    cy.getByTestId('checkout-button').click()

    cy.location('pathname').should('eq', '/checkout')
    cy.getByTestId('address-input').type('Москва, ул. Тестовая, д. 1')
    cy.getByTestId('pay-button').click()

    cy.getByTestId('order-success').should('be.visible')
    cy.getByTestId('order-id').invoke('text').should('match', /^LM-\d{6}$/)
    cy.getByTestId('cart-count').should('not.exist')

    // Заказ появился в истории покупок
    cy.getByTestId('order-id').invoke('text').then((number) => {
      cy.getByTestId('go-to-orders').click()
      cy.getByTestId('order-number').first().should('have.text', number)
    })
  })

  it('UC-10: после выхода покупка снова заблокирована', () => {
    cy.visit('/login')
    cy.login()
    cy.getByTestId('logout-button').click()
    cy.getByTestId('login-link').should('be.visible')

    cy.addFirstProductToCart()
    cy.getByTestId('nav-cart').click()
    cy.getByTestId('checkout-button').should('be.disabled')
  })
})
