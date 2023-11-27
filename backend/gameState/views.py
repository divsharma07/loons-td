from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import json
from .services import InsufficientFundsError, PlayerService
from django.conf import settings
import uuid

class StartGameView(APIView):
    def get(self, request, format=None):
        """
        Get method to start a new game.

        Args:
            request (HttpRequest): The HTTP request object.
            format (str, optional): The format of the response. Defaults to None.

        Returns:
            Response: The HTTP response containing the player ID and game configuration.
        """
        player_id = uuid.uuid4()
        player_service = PlayerService()
        with open(settings.BASE_DIR / 'gameState/config/game_config.json') as f:
            game_config = json.load(f)
            game_settings = game_config['game_settings']

        player_service.create_player(player_id, game_settings['initial_coins'], game_settings['inventory'])

        # Return the game configuration in the response
        return Response({
            'player_id': str(player_id),
            'game_config': game_config})

class BuyItemView(APIView):
    def post(self, request):
        """
        Post method to buy a turret.

        Args:
            request (HttpRequest): The HTTP request object.
            format (str, optional): The format of the response. Defaults to None.

        Returns:
            Response: The HTTP response indicating the success or failure of the item purchase.
        """
        player_id = request.data.get('playerId')
        item_id = request.data.get('itemId')

        if not player_id or not item_id:
            return Response({'message': 'Missing playerId or itemId'}, status=status.HTTP_400_BAD_REQUEST)

        player_service = PlayerService()
        try:
            player_service.buy_item(player_id, item_id)
            return Response({'message': 'Item bought successfully'}, status=status.HTTP_200_OK)
        except InsufficientFundsError:
            return Response({'message': 'Insufficient funds to buy item'}, status=status.HTTP_400_BAD_REQUEST)
