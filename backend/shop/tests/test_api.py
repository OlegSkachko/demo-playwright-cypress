from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from shop.models import CartItem, Order, Product


def make_product(**kwargs):
    defaults = dict(title='Колонка', category='Аудио', price=1000, emoji='🔊', gradient='#000')
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


class ApiTestCase(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='qa@lumen.shop', email='qa@lumen.shop', password='qa12345', first_name='QA'
        )
        self.cheap = make_product(title='Чехол', price=1490)
        self.pricey = make_product(title='Камера', price=32990)
        self.client = APIClient()

    def auth(self):
        token = self.client.post('/api/auth/login/', {'email': 'qa@lumen.shop', 'password': 'qa12345'}).data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')


class AuthTests(ApiTestCase):
    def test_login_success_returns_token_and_user(self):
        res = self.client.post('/api/auth/login/', {'email': ' QA@lumen.shop ', 'password': 'qa12345'})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['token'])
        self.assertEqual(res.data['user']['email'], 'qa@lumen.shop')

    def test_login_wrong_password(self):
        res = self.client.post('/api/auth/login/', {'email': 'qa@lumen.shop', 'password': 'nope'})
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data['detail'], 'Неверный email или пароль')

    def test_me_requires_auth(self):
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)
        self.auth()
        self.assertEqual(self.client.get('/api/auth/me/').data['name'], 'QA')


class CatalogTests(ApiTestCase):
    def test_products_are_public(self):
        res = self.client.get('/api/products/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual([p['title'] for p in res.data], ['Чехол', 'Камера'])


class CartTests(ApiTestCase):
    def test_guest_has_no_server_cart(self):
        self.assertEqual(self.client.get('/api/cart/').status_code, 401)
        self.assertEqual(self.client.post('/api/cart/items/', {'product_id': self.cheap.id}).status_code, 401)

    def test_add_change_and_remove_items(self):
        self.auth()
        self.client.post('/api/cart/items/', {'product_id': self.cheap.id})
        res = self.client.post('/api/cart/items/', {'product_id': self.cheap.id})
        self.assertEqual(res.data['count'], 2)
        self.assertEqual(res.data['subtotal'], 2980)
        self.assertEqual(res.data['delivery'], 390)  # бесплатная доставка только от 5 000 ₽
        res = self.client.patch(f'/api/cart/items/{self.cheap.id}/', {'quantity': 1}, format='json')
        self.assertEqual(res.data['count'], 1)
        res = self.client.delete(f'/api/cart/items/{self.cheap.id}/')
        self.assertEqual(res.data['items'], [])

    def test_merge_guest_cart(self):
        self.auth()
        self.client.post('/api/cart/items/', {'product_id': self.cheap.id})
        res = self.client.post('/api/cart/merge/', {'items': [
            {'product_id': self.cheap.id, 'quantity': 2},
            {'product_id': self.pricey.id, 'quantity': 1},
            {'product_id': 999, 'quantity': 1},
        ]}, format='json')
        self.assertEqual(res.data['count'], 4)

    def test_clear_cart(self):
        self.auth()
        self.client.post('/api/cart/items/', {'product_id': self.cheap.id})
        self.assertEqual(self.client.delete('/api/cart/').data['count'], 0)


class OrderTests(ApiTestCase):
    def test_guest_cannot_buy(self):
        res = self.client.post('/api/orders/', {'address': 'Москва'})
        self.assertEqual(res.status_code, 401)
        self.assertEqual(Order.objects.count(), 0)

    def test_empty_cart_cannot_be_ordered(self):
        self.auth()
        res = self.client.post('/api/orders/', {'address': 'Москва'})
        self.assertEqual(res.status_code, 400)

    def test_address_is_required(self):
        self.auth()
        self.client.post('/api/cart/items/', {'product_id': self.cheap.id})
        self.assertEqual(self.client.post('/api/orders/', {'address': ' '}).status_code, 400)

    def test_authorized_user_buys_products(self):
        self.auth()
        self.client.post('/api/cart/items/', {'product_id': self.cheap.id})
        self.client.post('/api/cart/items/', {'product_id': self.cheap.id})
        res = self.client.post('/api/orders/', {'address': 'Москва, ул. Тестовая, 1'})

        self.assertEqual(res.status_code, 201)
        self.assertRegex(res.data['number'], r'^LM-\d{6}$')
        self.assertEqual(res.data['status'], 'paid')
        self.assertEqual(res.data['subtotal'], 2980)
        self.assertEqual(res.data['delivery'], 390)
        self.assertEqual(res.data['total'], 3370)
        self.assertEqual(res.data['items'][0]['quantity'], 2)
        self.assertFalse(CartItem.objects.filter(user=self.user).exists())

        history = self.client.get('/api/orders/').data
        self.assertEqual([o['number'] for o in history], [res.data['number']])
        detail = self.client.get(f"/api/orders/{res.data['number']}/")
        self.assertEqual(detail.status_code, 200)

    def test_free_delivery_from_5000(self):
        self.auth()
        self.client.post('/api/cart/items/', {'product_id': self.pricey.id})
        res = self.client.post('/api/orders/', {'address': 'Москва'})
        self.assertEqual(res.data['delivery'], 0)

    def test_user_cannot_see_foreign_order(self):
        other = get_user_model().objects.create_user(username='x@x.x', password='x')
        order = Order.objects.create(user=other, address='a', subtotal=1, delivery=0, total=1)
        self.auth()
        self.assertEqual(self.client.get(f'/api/orders/{order.number}/').status_code, 404)
