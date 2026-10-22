describe('Неавторизованный пользователь', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('UC-01: видит каталог товаров и кнопку входа', () => {
    cy.getByTestId('product-card').should('have.length.greaterThan', 0)
    cy.getByTestId('login-link').should('be.visible')
    cy.getByTestId('user-chip').should('not.exist')
  })

  it('UC-02: ищет и фильтрует товары', () => {
    cy.getByTestId('search-input').type('наушники')
    cy.getByTestId('product-card').should('have.length', 1)
    cy.getByTestId('product-title').should('have.text', 'Наушники Aura Pro')

    cy.getByTestId('search-input').clear().type('несуществующий товар')
    cy.getByTestId('empty-search').should('be.visible')

    cy.getByTestId('search-input').clear()
    cy.getByTestId('filter-Дом').click()
    cy.getByTestId('product-category').should('have.length.greaterThan', 0).each(($chip) => {
      expect($chip.text()).to.eq('Дом')
    })
  })

  it('UC-03: добавляет товар в корзину', () => {
    cy.addFirstProductToCart()
    cy.getByTestId('nav-cart').click()
    cy.getByTestId('cart-item').should('have.length', 1)
    cy.get('@productTitle').then((title) => {
      cy.getByTestId('cart-item-title').should('have.text', title)
    })

    cy.getByTestId('qty-increment').click()
    cy.getByTestId('qty-value').should('have.text', '2')
    cy.getByTestId('cart-count').should('have.text', '2')
  })

  it('UC-04: не может оформить заказ из корзины', () => {
    cy.addFirstProductToCart()
    cy.getByTestId('nav-cart').click()
    cy.getByTestId('auth-required').should('be.visible')
    cy.getByTestId('checkout-button').should('be.disabled')
    cy.getByTestId('login-to-buy').should('be.visible')
  })

  it('UC-05: при прямом переходе на /checkout попадает на страницу входа', () => {
    cy.visit('/checkout')
    cy.location('pathname').should('eq', '/login')
    cy.getByTestId('login-form').should('be.visible')
  })
})
