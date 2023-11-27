# asgi.py
import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loonsTd.settings')
from django.core.asgi import get_asgi_application

from gameState import consumers

application = ProtocolTypeRouter({
  "http": get_asgi_application(),
  "websocket": URLRouter(
    [path('ws/loonsLocation/', consumers.LoonConsumer.as_asgi())]
  ),
})