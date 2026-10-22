from django.conf import settings
from django.db import models

FREE_DELIVERY_FROM = 5000
DELIVERY_PRICE = 390


def delivery_for(subtotal):
    return 0 if subtotal == 0 or subtotal >= FREE_DELIVERY_FROM else DELIVERY_PRICE


class Product(models.Model):
    title = models.CharField('Название', max_length=120, unique=True)
    category = models.CharField('Категория', max_length=60)
    price = models.PositiveIntegerField('Цена, ₽')
    rating = models.DecimalField('Рейтинг', max_digits=2, decimal_places=1, default=5)
    emoji = models.CharField('Эмодзи', max_length=8)
    gradient = models.CharField('CSS-градиент', max_length=200)
    description = models.TextField('Описание', blank=True)
    badge = models.CharField('Бейдж', max_length=20, blank=True)

    class Meta:
        ordering = ['id']
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'

    def __str__(self):
        return self.title


class CartItem(models.Model):
    """Товары, выбранные пользователем (корзина)."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['id']
        unique_together = [('user', 'product')]
        verbose_name = 'Товар в корзине'
        verbose_name_plural = 'Корзины'

    def __str__(self):
        return f'{self.user} — {self.product} × {self.quantity}'


class Order(models.Model):
    """Купленные товары: оформленный заказ."""

    class Status(models.TextChoices):
        PAID = 'paid', 'Оплачен'
        ASSEMBLING = 'assembling', 'Собирается'
        SHIPPED = 'shipped', 'Передан в доставку'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    number = models.CharField('Номер', max_length=20, unique=True, null=True, blank=True)
    status = models.CharField('Статус', max_length=20, choices=Status.choices, default=Status.PAID)
    address = models.CharField('Адрес', max_length=255)
    subtotal = models.PositiveIntegerField('Товары, ₽')
    delivery = models.PositiveIntegerField('Доставка, ₽')
    total = models.PositiveIntegerField('Итого, ₽')
    created_at = models.DateTimeField('Создан', auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.number:
            self.number = f'LM-{100000 + self.pk}'
            super().save(update_fields=['number'])

    def __str__(self):
        return self.number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    title = models.CharField(max_length=120)
    price = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField()

    class Meta:
        ordering = ['id']
        verbose_name = 'Позиция заказа'
        verbose_name_plural = 'Позиции заказа'

    def __str__(self):
        return f'{self.title} × {self.quantity}'
