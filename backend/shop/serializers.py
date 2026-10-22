from rest_framework import serializers

from .models import Order, OrderItem, Product


def user_payload(user):
    return {
        'id': user.id,
        'email': user.email,
        'name': user.get_full_name() or user.email,
    }


class ProductSerializer(serializers.ModelSerializer):
    rating = serializers.FloatField()

    class Meta:
        model = Product
        fields = ['id', 'title', 'category', 'price', 'rating', 'emoji', 'gradient', 'description', 'badge']


class OrderItemSerializer(serializers.ModelSerializer):
    emoji = serializers.CharField(source='product.emoji')

    class Meta:
        model = OrderItem
        fields = ['product', 'title', 'emoji', 'price', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    status_label = serializers.CharField(source='get_status_display')

    class Meta:
        model = Order
        fields = ['number', 'status', 'status_label', 'address', 'subtotal', 'delivery', 'total', 'created_at', 'items']
