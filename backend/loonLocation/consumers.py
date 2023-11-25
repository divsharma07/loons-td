# consumers.py
import asyncio
from .loon_logic import LoonWave
from channels.generic.websocket import AsyncWebsocketConsumer
import copy
import json
import random

NUM_LOONS = 15
BASE_START_POINT = (400, 400)  # replace with your actual base start point
START_POINT_RANGE = 50
END_POINT = (0, 0)
BATCH_RANGE = 4


class LoonConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling Loon updates.
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
        # sending infinite waves till a balloon goes out of
        while True:
            if self.is_game_over:
                break

            await self.initialize_wave()
            batch_size = 3
            while True:
                async with self.lock:
                    succesful = await self.loon_wave.update_loons(batch_size)

                    if not succesful:
                        self.is_game_over = True
                        data = {"msg": "Game Over"}
                        await self.send(json.dumps(data))
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
                                "position_x": loon.current_pos[0],
                                "position_y": loon.current_pos[1],
                            }
                            for loon in loon_batch
                            if loon.active
                            and loon in (await self.loon_wave.get_loons()).values()
                        ]
                    }

                    await self.send(json.dumps(data))

                    if batch_size <= NUM_LOONS:
                        batch_size += random.randint(0, 4)
                    # it is crucial to keep this low otherwise state data gets shared. Should be lower than shooting freq
                    await asyncio.sleep(0.1)  # Update frequency

    async def initialize_wave(self):
        self.loon_wave = LoonWave()

        # Example: Add a Loon
        for i in range(NUM_LOONS):
            start_point = [
                BASE_START_POINT[0]
                + random.uniform(-START_POINT_RANGE, START_POINT_RANGE),
                BASE_START_POINT[1]
                + random.uniform(-START_POINT_RANGE, START_POINT_RANGE),
            ]
            await self.loon_wave.add_loon(start_point, END_POINT)

    async def receive(self, text_data):
        """
        Called when a WebSocket frame is received from the client.
        """
        async with self.lock:
            print("\n delete loon " + text_data)
            json_data = json.loads(text_data)
            loon_id = json_data["publish"]["popLoon"]["loonId"]
            await self.loon_wave.remove_loon(loon_id)
