#!/bin/sh
python manage.py migrate
uvicorn loonsTd.asgi:application --host 0.0.0.0 --port 8000
exec "$@"