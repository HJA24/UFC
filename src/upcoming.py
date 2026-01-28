import logging
from scripts.weightclass import get_pool
from scripts.scrape.ufc.fights import get_fight_ids, get_n_possible_rounds
from scripts.scrape.ufc.fighters import get_fighter_ids
from typing import Dict


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def get_fight_card(event_id: int, **kwargs) -> Dict:
    fight_card = {}
    logger.info('collecting fights of upcoming event')

    fight_ids = get_fight_ids(event_id=event_id)

    for fight_id in fight_ids:
        blue, red = get_fighter_ids(fight_id=fight_id)
        logger.info(f'event: {event_id} - fight: {fight_id} - collecting history of fighters')

        fighters_pool = get_pool(
            fight_id=fight_id,
            blue=blue,
            red=red,
            **kwargs
        )

        if fighters_pool.N_common >= 1:
            n_rounds = get_n_possible_rounds(event_id=event_id, fight_id=fight_id)

            fight_card[fight_id] = {}
            fight_card[fight_id]['n_rounds'] = n_rounds
            fight_card[fight_id]['pool'] = fighters_pool

    return fight_card


