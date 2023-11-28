from enum import Enum
from asgiref.sync import sync_to_async
from django.db.models import F
from django.core.exceptions import ValidationError


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

        player = Player(
            id=id, coins=initial_coins, score=0, status=Game_States.PLAYING.name
        )

        # Save the Player instance to the database
        player.save()

        # Add items to the player's inventory
        for each_item in inventory:
            try:
                item = Item.objects.get(name=each_item["item_name"])
            except Item.DoesNotExist:
                raise Item.DoesNotExist(
                    "Item with name {} does not exist".format(each_item["item_name"])
                )

            Inventory.objects.create(
                player=player, item=item, quantity=each_item["quantity"]
            )
        return player

    def get_inventory(self, player_id):
        from .models import Inventory

        inventory_items = Inventory.objects.filter(player_id=player_id)
        return [self._serialize_inventory_item(item) for item in inventory_items]

    def _serialize_inventory_item(self, inventory_item):
        return {
            "item_id": inventory_item.item.id,
            "item_name": inventory_item.item.name,
            "quantity": inventory_item.quantity,
        }

    async def game_over(self, player_id):
        """
        End the game for the player with the given ID and save the final score.

        Args:
            player_id (int): The ID of the player.
            final_score (int): The final score of the player.

        Returns:
            Player: The updated player object.
        """
        from .models import Player

        try:
            # Get the player
            player = await sync_to_async(Player.objects.get)(id=player_id)

            # Update the player's status and score
            player.status = Game_States.GAME_OVER.name

            # Save the changes to the database
            await sync_to_async(player.save)()
        except Player.DoesNotExist:
            raise ValueError("Player with ID {} does not exist".format(player_id))

        return player

    async def add_coins(self, player_id, coins):
        """
        Add a certain number of coins to the player with the given ID.

        Args:
            player_id (int): The ID of the player.
            coins (int): The number of coins to add.

        Returns:
            int: The new number of coins for the player.
        """
        from .models import Player
        from django.db.models import F

        try:
            player = await sync_to_async(Player.objects.get)(id=player_id)
            player.coins = F("coins") + coins
            await sync_to_async(player.save)()
            await sync_to_async(player.refresh_from_db)()
            coins = await sync_to_async(getattr, thread_sensitive=True)(player, "coins")

            return coins
        except Player.DoesNotExist:
            raise ValueError("Player with ID {} does not exist".format(player_id))

    def get_coins(self, player_id):
        """
        Get the number of coins for the player with the given ID.

        Args:
            player_id (int): The ID of the player.

        Returns:
            int: The number of coins for the player.
        """
        from .models import Player

        try:
            player = Player.objects.get(id=player_id)
            return player.coins
        except Player.DoesNotExist:
            raise ValueError("Player with ID {} does not exist".format(player_id))

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
            return player.score
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
        except Player.DoesNotExist or ValidationError:
            raise Player.DoesNotExist(
                "Player with id {} does not exist".format(player_id)
            )

        if player.coins < item.cost:
            raise InsufficientFundsError(
                "Player does not have enough funds to buy this item"
            )

        try:
            inventory_item = Inventory.objects.get(player=player, item=item)
            inventory_item.quantity = F("quantity") + 1
            inventory_item.save()
            inventory_item.refresh_from_db()
        except Inventory.DoesNotExist:
            player.inventory.create(item=item, quantity=1)
        player.coins -= item.cost
        player.save()
        return self._serialize_inventory_item(inventory_item)


    def use_item(self, player_id, item_name):
        from .models import Inventory, Item, Player

        try:
            item = Item.objects.get(name=item_name)
        except Item.DoesNotExist:
            raise Item.DoesNotExist(
                "Item with name {} does not exist".format(item_name)
            )

        try:
            player = Player.objects.get(id=player_id)
        except Player.DoesNotExist or ValidationError:
            raise Player.DoesNotExist(
                "Player with id {} does not exist".format(player_id)
            )
        try:
            inventory_item = Inventory.objects.get(player=player, item=item)
            if inventory_item.quantity <= 0:
                raise InsufficientQuantityError("Insufficient quantity of item")
            inventory_item.quantity -= 1
            inventory_item.save()
            inventory_item.refresh_from_db()
            return self._serialize_inventory_item(inventory_item)
        except Inventory.DoesNotExist:
            raise ItemNotFoundError("Item not found in inventory")


class InsufficientFundsError(Exception):
    """Raised when a player does not have enough funds to buy the item."""

    pass


class InsufficientQuantityError(Exception):
    """Raised when a player does not have item left."""

    pass


class ItemNotFoundError(Exception):
    """Item not found"""

    pass


class Game_States(Enum):
    PLAYING = 1
    GAME_OVER = 2
