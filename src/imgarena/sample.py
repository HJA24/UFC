import asyncio
import websockets
from websockets.asyncio.client import connect
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
    )
logger = logging.getLogger(__name__)


URL = f'wss://dde-streams.data.imgarena.com/media/mma/fights/999991/details'


async def main():
    async for ws in connect(uri=f'wss://dde-streams.data.imgarena.com/media/mma/fights/999991/details'):
        try:
            message = await ws.recv()
            print(message)
        except websockets.exceptions.InvalidStatus as e:
            print(str(e))
            return None



if __name__ == "__main__":
    asyncio.run(main())