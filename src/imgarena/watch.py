import logging
import sys
sys.path.append('/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/database')
import asyncio
from events import get_fights
from event_center import EventCenter


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
    )
logger = logging.getLogger(__name__)


async def main() -> None:
    event_id = 901
    fights = await get_fights(event_id=event_id, insert=False)
    event_center = EventCenter(event_id=event_id,
                               fights=fights)

    await event_center.watch()

asyncio.run(main())
