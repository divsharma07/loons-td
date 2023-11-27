from django.urls import path
from . import views
from . import consumers

urlpatterns = [
    # Define your HTTP routes here
    path('start/', views.StartGameView.as_view(), name='start'),
    path('buy/', views.BuyItemView.as_view(), name='buy'),
    path('use/', views.UseItemView.as_view(), name='useItem')
]

websocket_urlpatterns = [
    path('ws/loonsLocation/', consumers.LoonConsumer.as_asgi()),
]