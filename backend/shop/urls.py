from django.urls import path

from . import views

urlpatterns = [
    path('auth/login/', views.login),
    path('auth/logout/', views.logout),
    path('auth/me/', views.me),
    path('products/', views.products),
    path('cart/', views.cart),
    path('cart/items/', views.cart_add),
    path('cart/items/<int:product_id>/', views.cart_item),
    path('cart/merge/', views.cart_merge),
    path('orders/', views.orders),
    path('orders/<str:number>/', views.order_detail),
    path('notifications/broadcast/', views.broadcast),
]
