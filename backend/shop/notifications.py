"""Отправка уведомлений в WebSocket через channel layer."""
import threading

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.db import close_old_connections
from django.utils import timezone

PUBLIC_GROUP = 'public'


def user_group(user_id):
    return f'user_{user_id}'


def build_message(kind, text, data=None):
    return {'type': kind, 'text': text, 'data': data or {}, 'ts': timezone.now().isoformat()}


def send_to_group(group, kind, text, data=None):
    async_to_sync(get_channel_layer().group_send)(
        group, {'type': 'notify', 'message': build_message(kind, text, data)}
    )


def notify_user(user_id, kind, text, data=None):
    send_to_group(user_group(user_id), kind, text, data)


def broadcast(text, data=None):
    send_to_group(PUBLIC_GROUP, 'broadcast', text, data)


def notify_order_created(order):
    notify_user(
        order.user_id,
        'order.created',
        f'Заказ {order.number} оформлен и оплачен',
        {'number': order.number, 'status': order.status, 'total': order.total},
    )


def schedule_order_progress(order_id):
    """Имитирует работу склада: через паузы двигает заказ по статусам и шлёт уведомления."""
    if not settings.ORDER_STATUS_SIMULATION:
        return
    from .models import Order

    steps = [Order.Status.ASSEMBLING, Order.Status.SHIPPED]

    def advance(step_index):
        close_old_connections()
        try:
            order = Order.objects.get(pk=order_id)
            status = steps[step_index]
            order.status = status
            order.save(update_fields=['status'])
            notify_user(
                order.user_id,
                'order.status',
                f'Заказ {order.number}: {order.get_status_display().lower()}',
                {'number': order.number, 'status': status},
            )
            if step_index + 1 < len(steps):
                threading.Timer(settings.ORDER_STATUS_DELAY, advance, args=[step_index + 1]).start()
        except Order.DoesNotExist:
            pass
        finally:
            close_old_connections()

    threading.Timer(settings.ORDER_STATUS_DELAY, advance, args=[0]).start()
