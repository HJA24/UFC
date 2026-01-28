import logging
from events import get_past_event_ids
from ufc.fights import get_fight_ids, process_fight
from ufc.stats import process_stats
from ufc.scorecards import process_scorecards
from ufc.events import process_event
from database.domain import get_event_ids_in_db


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


year = 2026


if __name__ == "__main__":
    event_ids_in_db = get_event_ids_in_db(year=year)
    past_event_ids  = get_past_event_ids()

    missing_event_ids = list(set(past_event_ids) - set(event_ids_in_db))
    logger.info(f'there are {len(missing_event_ids)} events missing')

    for event_id in missing_event_ids:
        logger.info(f'event: {event_id} - processing event')
        process_event(event_id=event_id)

        fight_ids = get_fight_ids(event_id=event_id)
        logger.info(f'event: {event_id} - processing fights')

        for fight_id in fight_ids:
            logger.info(f'event: {event_id} - fight: {fight_id} - processing fight')
            process_fight(fight_id=fight_id)
            process_stats(fight_id=fight_id)
            process_scorecards(fight_id=fight_id, db_type='sqlite')
            logger.info(f'event: {event_id} - fight: {fight_id} - processed fight')



