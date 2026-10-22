from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def get_user_by_token(key):
    from rest_framework.authtoken.models import Token

    try:
        return Token.objects.select_related('user').get(key=key).user
    except Token.DoesNotExist:
        return AnonymousUser()


class TokenAuthMiddleware(BaseMiddleware):
    """Достаёт пользователя по ?token=... — браузерный WebSocket не умеет слать заголовок Authorization."""

    async def __call__(self, scope, receive, send):
        token = parse_qs(scope.get('query_string', b'').decode()).get('token', [None])[0]
        scope['user'] = await get_user_by_token(token) if token else AnonymousUser()
        return await super().__call__(scope, receive, send)
