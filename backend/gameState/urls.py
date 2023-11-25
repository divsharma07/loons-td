# gamestate/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Define your HTTP routes here
    path('some-game-state/', views.some_game_state_view, name='game-state-view'),
    # ...
]