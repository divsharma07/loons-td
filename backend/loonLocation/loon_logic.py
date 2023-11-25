import random
import asyncio


class Loon:
    def __init__(self, loon_id, start_pos, end_pos):
        """
        Initialize a Loon object.

        Args:
            loon_id (int): The ID of the loon.
            start_pos (tuple): The starting position of the loon (x, y).
            end_pos (tuple): The ending position of the loon (x, y).
        """
        self.loon_id = loon_id
        self.current_pos = start_pos
        self.end_pos = end_pos
        self.active = True
        self.lock = asyncio.Lock()

    async def move(self, delta_x, delta_y):
        """
        Move the loon by the specified deltas.

        Args:
            delta_x (int): The change in x-coordinate.
            delta_y (int): The change in y-coordinate.

        Returns:
            bool: True if the loon is still active after moving, False otherwise.
        """
        async with self.lock:
            self.current_pos = (
                self.current_pos[0] - delta_x,
                self.current_pos[1] - delta_y,
            )
            # marking inactive if out of bounds
            if (
                self.current_pos[0] < self.end_pos[0]
                or self.current_pos[1] < self.end_pos[1]
            ):
                self.active = False
                return False
            else:
                return True
        
    def __repr__(self):
        return f"Loon(id={self.loon_id}, active={self.active})\n"


import asyncio
import copy
import random

class LoonWave:
    LOON_DELTA = 2

    def __init__(self):
        self.loons = {}
        self.next_loon_id = 0
        self.lock = asyncio.Lock()

    async def get_loons(self):
        async with self.lock:
            return self.loons

    async def add_loon(self, start_pos, end_pos):
        """
        Add a new loon to the wave.

        Args:
            start_pos (tuple): The starting position of the loon.
            end_pos (tuple): The ending position of the loon.
        """
        async with self.lock:
            loon = Loon(self.next_loon_id, start_pos, end_pos)
            self.loons[self.next_loon_id] = loon
            self.next_loon_id += 1

    async def size(self):
        """
        Get the number of loons in the wave.

        Returns:
            int: The number of loons.
        """
        async with self.lock:
            return len(self.loons)

    async def remove_loon(self, loon_id):
        """
        Remove a loon from the wave.

        Args:
            loon_id (int): The ID of the loon to remove.
        """
        async with self.lock:
            if loon_id in self.loons:
                self.loons[loon_id].active = False
                del self.loons[loon_id]

    async def update_loons(self, batch_size):
        """
        Update the positions of the loons in the wave.

        Args:
            batch_size (int): The number of loons to update in each batch.
        """
        loons_batch = list(self.loons.keys())[:batch_size]
        # print(" current batch " + str(loons_batch))
        for loon_id in loons_batch:
            # locking here so that we are sure we are only showing a loon that is active
            async with self.lock:
                if not self.loons[loon_id].active:
                    continue
                delta_x, delta_y = random.randint(0, self.LOON_DELTA), random.randint(
                    0, self.LOON_DELTA
                )
                # returns false if any loon goes out of bounds
                if not await self.loons[loon_id].move(delta_x, delta_y):
                    return False

        return True