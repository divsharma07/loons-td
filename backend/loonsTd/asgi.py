# asgi.py

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
import loonLocation.routing;
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loonsTd.settings')

application = ProtocolTypeRouter({
  "http": get_asgi_application(),
  "websocket": URLRouter(
      loonLocation.routing.websocket_urlpatterns,
  ),
})