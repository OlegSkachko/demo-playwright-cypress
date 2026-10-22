from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .notifications import PUBLIC_GROUP, build_message, user_group


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    ws://<host>/ws/notifications/?token=<api token>

    Гость подписан только на общие рассылки, авторизованный пользователь — ещё и на личные уведомления.
    """

    async def connect(self):
        user = self.scope.get('user')
        self.subscriptions = [PUBLIC_GROUP]
        if user and user.is_authenticated:
            self.subscriptions.append(user_group(user.id))
        for group in self.subscriptions:
            await self.channel_layer.group_add(group, self.channel_name)
        await self.accept()

        if user and user.is_authenticated:
            name = user.first_name or user.email
            text = f'{name}, вы подключены к уведомлениям'
        else:
            text = 'Вы подключены к уведомлениям как гость'
        await self.send_json(build_message('welcome', text, {'authenticated': len(self.subscriptions) > 1}))

    async def disconnect(self, code):
        for group in getattr(self, 'subscriptions', []):
            await self.channel_layer.group_discard(group, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get('type') == 'ping':
            await self.send_json(build_message('pong', 'pong'))

    async def notify(self, event):
        await self.send_json(event['message'])
