from django.contrib.auth import authenticate
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from . import notifications
from .models import CartItem, Order, OrderItem, Product, delivery_for
from .serializers import OrderSerializer, ProductSerializer, user_payload


# ---------- Авторизация ----------

@api_view(['POST'])
def login(request):
    email = str(request.data.get('email', '')).strip().lower()
    password = request.data.get('password', '')
    user = authenticate(username=email, password=password)
    if not user:
        return Response({'detail': 'Неверный email или пароль'}, status=status.HTTP_400_BAD_REQUEST)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': user_payload(user)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    # Токен не удаляем: им может пользоваться другая вкладка/устройство того же пользователя
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(user_payload(request.user))


# ---------- Каталог ----------

@api_view(['GET'])
def products(request):
    return Response(ProductSerializer(Product.objects.all(), many=True).data)


# ---------- Корзина (выбранные товары) ----------

def cart_payload(user):
    items = CartItem.objects.filter(user=user).select_related('product')
    subtotal = sum(i.product.price * i.quantity for i in items)
    delivery = delivery_for(subtotal)
    return {
        'items': [{'product': ProductSerializer(i.product).data, 'quantity': i.quantity} for i in items],
        'count': sum(i.quantity for i in items),
        'subtotal': subtotal,
        'delivery': delivery,
        'total': subtotal + delivery,
    }


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def cart(request):
    if request.method == 'DELETE':
        CartItem.objects.filter(user=request.user).delete()
    return Response(cart_payload(request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cart_add(request):
    product = get_object_or_404(Product, pk=request.data.get('product_id'))
    item, created = CartItem.objects.get_or_create(user=request.user, product=product)
    if not created:
        item.quantity += 1
        item.save(update_fields=['quantity'])
    return Response(cart_payload(request.user))


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def cart_item(request, product_id):
    item = get_object_or_404(CartItem, user=request.user, product_id=product_id)
    quantity = int(request.data.get('quantity', 0)) if request.method == 'PATCH' else 0
    if quantity > 0:
        item.quantity = quantity
        item.save(update_fields=['quantity'])
    else:
        item.delete()
    return Response(cart_payload(request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cart_merge(request):
    """Переносит гостевую корзину (из localStorage) в серверную после входа."""
    for entry in request.data.get('items', []):
        product = Product.objects.filter(pk=entry.get('product_id')).first()
        quantity = int(entry.get('quantity', 0))
        if not product or quantity <= 0:
            continue
        item, created = CartItem.objects.get_or_create(
            user=request.user, product=product, defaults={'quantity': quantity}
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=['quantity'])
    return Response(cart_payload(request.user))


# ---------- Заказы (купленные товары) ----------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def orders(request):
    if request.method == 'GET':
        qs = Order.objects.filter(user=request.user).prefetch_related('items__product')
        return Response(OrderSerializer(qs, many=True).data)

    address = str(request.data.get('address', '')).strip()
    if not address:
        return Response({'detail': 'Укажите адрес доставки'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        items = list(CartItem.objects.select_for_update().filter(user=request.user).select_related('product'))
        if not items:
            return Response({'detail': 'Корзина пуста'}, status=status.HTTP_400_BAD_REQUEST)
        subtotal = sum(i.product.price * i.quantity for i in items)
        delivery = delivery_for(subtotal)
        order = Order.objects.create(
            user=request.user, address=address, subtotal=subtotal, delivery=delivery, total=subtotal + delivery
        )
        OrderItem.objects.bulk_create([
            OrderItem(order=order, product=i.product, title=i.product.title, price=i.product.price, quantity=i.quantity)
            for i in items
        ])
        CartItem.objects.filter(user=request.user).delete()
        transaction.on_commit(lambda: notifications.notify_order_created(order))
        transaction.on_commit(lambda: notifications.schedule_order_progress(order.pk))

    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, number):
    order = get_object_or_404(Order, user=request.user, number=number)
    return Response(OrderSerializer(order).data)


# ---------- Рассылка всем подключённым (для админа/демо) ----------

@api_view(['POST'])
@permission_classes([IsAdminUser])
def broadcast(request):
    text = str(request.data.get('text', '')).strip()
    if not text:
        return Response({'detail': 'Пустое сообщение'}, status=status.HTTP_400_BAD_REQUEST)
    notifications.broadcast(text)
    return Response(status=status.HTTP_202_ACCEPTED)
