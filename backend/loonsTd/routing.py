from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    path('ws/loonsLocation/', consumers.LoonConsumer.as_asgi()),
]
