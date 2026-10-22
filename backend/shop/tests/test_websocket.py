from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from config.asgi import application
from shop.models import Product
from shop.notifications import broadcast


class WebSocketTests(TransactionTestCase):
    """Проверяем WebSocket-уведомления на уровне ASGI, без браузера."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='qa@lumen.shop', email='qa@lumen.shop', password='qa12345', first_name='QA'
        )
        self.token = Token.objects.create(user=self.user).key
        self.product = Product.objects.create(title='Чехол', category='Аксессуары', price=1490, emoji='📱', gradient='#000')

    async def connect(self, token=None):
        path = '/ws/notifications/' + (f'?token={token}' if token else '')
        communicator = WebsocketCommunicator(application, path)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        return communicator

    async def test_guest_receives_welcome(self):
        ws = await self.connect()
        message = await ws.receive_json_from()
        self.assertEqual(message['type'], 'welcome')
        self.assertFalse(message['data']['authenticated'])
        self.assertIn('гость', message['text'])
        await ws.disconnect()

    async def test_authorized_user_receives_personal_welcome(self):
        ws = await self.connect(self.token)
        message = await ws.receive_json_from()
        self.assertTrue(message['data']['authenticated'])
        self.assertTrue(message['text'].startswith('QA,'))
        await ws.disconnect()

    async def test_invalid_token_falls_back_to_guest(self):
        ws = await self.connect('invalid-token')
        message = await ws.receive_json_from()
        self.assertFalse(message['data']['authenticated'])
        await ws.disconnect()

    async def test_ping_pong(self):
        ws = await self.connect()
        await ws.receive_json_from()
        await ws.send_json_to({'type': 'ping'})
        self.assertEqual((await ws.receive_json_from())['type'], 'pong')
        await ws.disconnect()

    async def test_order_created_notification_goes_only_to_owner(self):
        owner = await self.connect(self.token)
        guest = await self.connect()
        await owner.receive_json_from()
        await guest.receive_json_from()

        def buy():
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Token {self.token}')
            client.post('/api/cart/items/', {'product_id': self.product.id})
            return client.post('/api/orders/', {'address': 'Москва'}).data

        order = await sync_to_async(buy)()

        message = await owner.receive_json_from(timeout=2)
        self.assertEqual(message['type'], 'order.created')
        self.assertEqual(message['data']['number'], order['number'])
        self.assertIn(order['number'], message['text'])
        self.assertTrue(await guest.receive_nothing(timeout=0.3))

        await owner.disconnect()
        await guest.disconnect()

    async def test_broadcast_reaches_guests_and_users(self):
        user_ws = await self.connect(self.token)
        guest_ws = await self.connect()
        await user_ws.receive_json_from()
        await guest_ws.receive_json_from()

        await sync_to_async(broadcast)('Скидка 10% на всё')

        for ws in (user_ws, guest_ws):
            message = await ws.receive_json_from()
            self.assertEqual(message['type'], 'broadcast')
            self.assertEqual(message['text'], 'Скидка 10% на всё')
            await ws.disconnect()

    def test_broadcast_endpoint_is_admin_only(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {self.token}')
        self.assertEqual(client.post('/api/notifications/broadcast/', {'text': 'hi'}).status_code, 403)
