from django.db import models
import uuid

class Player(models.Model):
    """
    Represents a player in the game.
    """
    id =  models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coins = models.IntegerField()
    score = models.IntegerField()
    status = models.CharField(max_length=20)
    inventory = models.ManyToManyField('Item', through='Inventory')

class Item(models.Model):
    """
    Represents an item in the game.
    """
    name = models.CharField(max_length=50)
    cost = models.IntegerField()
    level = models.IntegerField(default = 1)

class Inventory(models.Model):
    """
    Represents the inventory of a player.
    """
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player_inventory')
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.IntegerField()