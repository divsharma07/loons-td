from asgiref.sync import sync_to_async
from django.db.models import F
class PlayerService:
    def create_player(self, id, initial_coins, inventory):
        """
        Create a new player with the given ID, initial coins, and inventory.

        Args:
            id (int): The ID of the player.
            initial_coins (int): The initial number of coins for the player.
            inventory (list): A list of items in the player's inventory.

        Returns:
            Player: The created player instance.
        """
        from .models import Item, Inventory, Player

        player = Player(id=id, coins=initial_coins, score=0, status="playing")

        # Save the Player instance to the database
        player.save()

        # Add items to the player's inventory
        for each_item in inventory:
            try:
                item = Item.objects.get(name=each_item["name"])
            except Item.DoesNotExist:
                raise Item.DoesNotExist(
                    "Item with name {} does not exist".format(each_item["name"])
                )

            Inventory.objects.create(
                player=player, item=item, quantity=each_item["count"]
            )
        return player

    async def increase_score(self, player_id, amount):
        """
        Increase the score of the player with the given ID by the specified amount.

        Args:
            player_id (int): The ID of the player.
            amount (int): The amount to increase the score by.
        """
        from .models import Player

        try:
            player = await sync_to_async(Player.objects.get)(id=player_id)
            player.score += amount
            await sync_to_async(player.save)()
        except Player.DoesNotExist:
            raise Player.DoesNotExist(
                "Player with id {} does not exist".format(player_id)
            )

    def buy_item(self, player_id, item_name):
        """
        Buy an item with the given name for the player with the specified ID.

        Args:
            player_id (int): The ID of the player.
            item_name (str): The name of the item to buy.

        Raises:
            Item.DoesNotExist: If the item with the given name does not exist.
            Player.DoesNotExist: If the player with the specified ID does not exist.
            InsufficientFundsError: If the player does not have enough funds to buy the item.
        """
        from .models import Item, Inventory, Player

        try:
            item = Item.objects.get(name=item_name)
        except Item.DoesNotExist:
            raise Item.DoesNotExist(
                "Item with name {} does not exist".format(item_name)
            )
        try:
            player = Player.objects.get(id=player_id)
        except Player.DoesNotExist:
            raise Player.DoesNotExist(
                "Player with id {} does not exist".format(player_id)
            )

        if player.coins < item.cost:
            raise InsufficientFundsError(
                "Player does not have enough funds to buy this item"
            )

        try:
            inventory_item = Inventory.objects.get(player=player, item = item)
            inventory_item.quantity = F('quantity') + 1
            inventory_item.save()
        except Inventory.DoesNotExist:
            player.inventory.create(item=item, quantity=1)
        player.coins -= item.cost
        player.save()


class InsufficientFundsError(Exception):
    """Raised when a player does not have enough funds to buy the item."""

    pass
