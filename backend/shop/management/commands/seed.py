from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from shop.models import CartItem, Order, OrderItem, Product, delivery_for

PRODUCTS = [
    dict(title='Наушники Aura Pro', category='Аудио', price=18990, rating=4.9, emoji='🎧', badge='Хит',
         gradient='linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
         description='Активное шумоподавление, 40 часов работы и пространственный звук.'),
    dict(title='Смарт-часы Pulse 3', category='Гаджеты', price=24490, rating=4.7, emoji='⌚',
         gradient='linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
         description='Пульс, сон, кислород в крови и 14 дней без подзарядки.'),
    dict(title='Колонка Echo Mini', category='Аудио', price=7990, rating=4.6, emoji='🔊', badge='−20%',
         gradient='linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
         description='Компактная колонка с глубоким басом и защитой от воды IP67.'),
    dict(title='Лампа Nova Glow', category='Дом', price=5490, rating=4.8, emoji='💡',
         gradient='linear-gradient(135deg, #facc15 0%, #f97316 100%)',
         description='16 млн цветов, управление голосом и сценарии освещения.'),
    dict(title='Рюкзак Urban Flow', category='Аксессуары', price=6990, rating=4.5, emoji='🎒',
         gradient='linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
         description='Водоотталкивающая ткань, отсек для ноутбука 16″.'),
    dict(title='Камера Snap 4K', category='Гаджеты', price=32990, rating=4.8, emoji='📷', badge='Новинка',
         gradient='linear-gradient(135deg, #64748b 0%, #1e293b 100%)',
         description='Экшн-камера 4K/60, стабилизация и подводный бокс в комплекте.'),
    dict(title='Кофемашина Brew', category='Дом', price=21990, rating=4.7, emoji='☕',
         gradient='linear-gradient(135deg, #a16207 0%, #451a03 100%)',
         description='Эспрессо, капучино и латте одной кнопкой.'),
    dict(title='Чехол Shell Air', category='Аксессуары', price=1490, rating=4.4, emoji='📱',
         gradient='linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
         description='Ультратонкий чехол с защитой углов и поддержкой MagSafe.'),
]

# email, пароль, имя, фамилия, корзина {товар: кол-во}, история заказов [{товар: кол-во}]
USERS = [
    ('demo@lumen.shop', 'demo123', 'Анна', 'Смирнова',
     {'Наушники Aura Pro': 1, 'Лампа Nova Glow': 2},
     [{'Колонка Echo Mini': 1, 'Чехол Shell Air': 2}, {'Кофемашина Brew': 1}]),
    ('ivan@lumen.shop', 'ivan123', 'Иван', 'Петров',
     {'Камера Snap 4K': 1},
     [{'Рюкзак Urban Flow': 1}]),
    # Отдельный аккаунт для автотестов: пустая корзина, тесты сами наводят порядок
    ('qa@lumen.shop', 'qa12345', 'QA', 'Тестировщик', {}, []),
]


class Command(BaseCommand):
    help = 'Заполняет базу демо-данными: товары, пользователи, корзины и заказы (идемпотентно)'

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        by_title = {}
        for data in PRODUCTS:
            product, _ = Product.objects.update_or_create(title=data['title'], defaults=data)
            by_title[product.title] = product
        self.stdout.write(f'Товаров: {len(by_title)}')

        for email, password, first, last, cart, orders in USERS:
            user, created = User.objects.get_or_create(
                username=email, defaults={'email': email, 'first_name': first, 'last_name': last}
            )
            if not created:
                continue
            user.set_password(password)
            user.save()
            for title, qty in cart.items():
                CartItem.objects.create(user=user, product=by_title[title], quantity=qty)
            for order_items in orders:
                subtotal = sum(by_title[t].price * q for t, q in order_items.items())
                delivery = delivery_for(subtotal)
                order = Order.objects.create(
                    user=user, status=Order.Status.SHIPPED, address='Москва, ул. Демо, д. 1',
                    subtotal=subtotal, delivery=delivery, total=subtotal + delivery,
                )
                for t, q in order_items.items():
                    p = by_title[t]
                    OrderItem.objects.create(order=order, product=p, title=p.title, price=p.price, quantity=q)
            self.stdout.write(f'Пользователь {email} / {password}')

        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@lumen.shop', 'admin')
            self.stdout.write('Админка: admin / admin')
