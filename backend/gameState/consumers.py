# consumers.py
import asyncio
from asgiref.sync import sync_to_async
from .loon_logic import LoonType, LoonWave
from channels.generic.websocket import AsyncWebsocketConsumer
import copy
import json
import random
from .services import PlayerService


class LoonConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling Loon updates.

    Attributes:
        lock (asyncio.Lock): A lock to ensure thread safety.
        is_game_over (bool): Flag indicating if the game is over.
    """

    def __init__(self):
        super().__init__()
        self.lock = asyncio.Lock()
        self.is_game_over = False

    async def connect(self):
        """
        Called when the WebSocket is handshaking as part of the connection process.
        """
        await self.accept()
        self.player_id = self.scope["url_route"]["kwargs"]["player_id"]

        # Start the update loop
        asyncio.get_event_loop().create_task(self.send_loon_updates())

    async def disconnect(self, close_code):
        """
        Called when the WebSocket closes for any reason.
        """
        # Handle disconnection
        pass

    async def send_loon_updates(self):
        """
        Sends Loon updates to the connected WebSocket client.
        """
        num_loons = 15
        base_start_point = (800, 500)  # replace with your actual base start point
        start_point_range = 60
        end_point = (0, 0)
        # sending infinite waves till a balloon goes out of
        while True:
            if self.is_game_over:
                break

            await self.initialize_wave(
                num_loons, base_start_point, start_point_range, end_point
            )
            batch_size = 3
            while True:
                async with self.lock:
                    succesful = await self.loon_wave.update_loons(batch_size)

                    if not succesful:
                        self.is_game_over = True
                        player_service = PlayerService()
                        player = await player_service.game_over(self.player_id)
                        data = {"msg": "Game Over", "score": player.score, "coins": player.coins}
                        try:
                            await self.send(json.dumps(data))
                        except RuntimeError as e:
                            print(f"An error occurred while sending data, websocet connection closed {e}")
                        break

                    # Prepare data for sending
                    loon_batch = [
                        loon for loon in self.loon_wave.loons.values() if loon.active
                    ][:batch_size]

                    # current wave is over
                    if len(loon_batch) == 0:
                        break

                    data = {
                        "loonState": [
                            {
                                "id": loon.loon_id,
                                "type": loon.loon_type.name,
                                "position_x": loon.current_pos[0],
                                "position_y": loon.current_pos[1],
                            }
                            for loon in loon_batch
                            if loon.active
                            and loon in (await self.loon_wave.get_loons()).values()
                        ]
                    }

                    try:
                        await self.send(json.dumps(data))
                    except RuntimeError as e:
                        print(f"An error occurred while sending data: {e}")

                    if batch_size <= num_loons:
                        batch_size += random.randint(0, 4)
                    # it is crucial to keep this low otherwise state data gets shared. Should be lower than shooting freq
                    await asyncio.sleep(0.05)  # Update frequency

            # adding 1 score every time a wave is completed
            # there are multiple ways of increasing coins but for now adding 500 coins after every 10 waves
            player_service = PlayerService()
            player_score = await player_service.increase_score(self.player_id, 1)
            data = {"update": {"score": player_score}}
            if player_score % 10 == 0:
                coins = await player_service.add_coins(self.player_id, 500)
                data["update"]["coins"] = str(coins)
            try:
                await self.send(json.dumps(data))
            except RuntimeError as e:
                print(f"An error occurred while sending data: {e}")

            # increasing difficulty
            start_point_range += 10
            num_loons += 5
            # this essentially increases the movement of the loons
            self.loon_wave.loon_delta += 1

    async def initialize_wave(
        self, num_loons, base_start_point, start_point_range, end_point
    ):
        """
        Initializes a new wave of Loons.
        """
        self.loon_wave = LoonWave()

        for i in range(num_loons):
            start_point = [
                base_start_point[0]
                + random.uniform(-start_point_range, start_point_range),
                base_start_point[1]
                + random.uniform(-start_point_range, start_point_range),
            ]
            # chosen to use the random way of doing this, which does not guarantee 10% but is more extensible for later
            #instead of just doing 1/10 of num_loons for AdvancedLoons
            loon_type = random.choices(
                [LoonType.BasicLoon, LoonType.AdvancedLoon], weights=[0.9, 0.1], k=1
            )[0]
            await self.loon_wave.add_loon(start_point, end_point, loon_type.value)

    async def receive(self, text_data):
        """
        Called when a WebSocket frame is received from the client.

        Args:
            text_data (str): The received text data.
        """
        async with self.lock:
            try:
                json_data = json.loads(text_data)

                action = json_data["action"]
                if action != "popLoon":
                    return

                loon_id = json_data["loonId"]

                if not self.is_loon_present(loon_id):
                    await self.send(
                        text_data=json.dumps(
                            {"error": "Invalid action: No such loon"}
                        )
                    )
                    return

                if (
                    "loonLevel" in json_data
                    and "itemLevel" in json_data
                    and int(json_data["bulletLevel"])
                    < int(json_data["bulletLevel"])
                ):
                    await self.send(
                        text_data=json.dumps(
                            {"error": "Invalid action: Level is not enough"}
                        )
                    )
                    return

                await self.loon_wave.remove_loon(loon_id)
            except Exception as e:
                print(f"An error occurred while processing the received data: {e}")

    def is_loon_present(self, loon_id):
        """
        Check if a loon with the given ID is present.
        """
        return self.loon_wave.is_loon_present(loon_id)
