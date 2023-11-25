# routing.py

from django.urls import path
from . import consumers  # Assuming your consumer is in consumers.py

websocket_urlpatterns = [
    path('ws/loonsLocation/', consumers.LoonConsumer.as_asgi()),
]