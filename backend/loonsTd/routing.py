from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/loonsLocation/', consumers.LoonConsumer.as_asgi()),
]
