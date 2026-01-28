import os
import logging
import json
# from concurrent.futures import ThreadPoolExecutor
from stats.striking_stats import get_striking_stats_records
from stats.grappling_stats import get_grappling_stats_records
from stats.control_stats import get_control_stats_records
from stats.position_stats import get_position_stats_records
from stats.stats_category import StatsCategory
from ufc.fighters.fighters import get_fighter, get_winner
from database.domain import insert_stats_records


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


FIGHTS_PATH = '/Users/huibmeulenbelt/PycharmProjects/ufc/data/fights/ufc/'


def process_stats(fight_id: int) -> None:
    logger.info(f'fight {fight_id} - collecting stats')

    try:
        data = json.load(open(os.path.join(FIGHTS_PATH, f'{fight_id}.json')))

        fighters = data['Fighters']

        fighter_blue = get_fighter(fighters=fighters, corner='blue')
        fighter_red  = get_fighter(fighters=fighters, corner='red')

        fighter_id_blue = fighter_blue['FighterId']
        fighter_id_red  = fighter_red['FighterId']
        winner_id       = get_winner(fighters=fighters)

        method     = data['Result']['Method'].lower()
        last_round = data['Result']['EndingRound']
        stats      = data['RoundStats']

        if len(stats) == 0:
            return None

        data_blue = [stat['Rounds'] for stat in stats if stat['FighterId'] == fighter_id_blue][0]
        data_red  = [stat['Rounds'] for stat in stats if stat['FighterId'] == fighter_id_red][0]

        for data_of_round_blue, data_of_round_red in zip(data_blue, data_red):
            round = data_of_round_blue['RoundNumber']

            data_of_round_red['Knockout']    = 0
            data_of_round_blue['Knockout']   = 0
            data_of_round_red['Submission']  = 0
            data_of_round_blue['Submission'] = 0

            if round == last_round:
                if fighter_id_blue == winner_id:
                    if method == 'ko/tko':
                        data_of_round_blue['Knockout'] = 1
                    elif method == 'submission':
                        data_of_round_blue['Submission'] = 1

                elif fighter_id_red == winner_id:
                    if method == 'ko/tko':
                        data_of_round_red['Knockout'] = 1
                    elif method == 'submission':
                        data_of_round_red['Submission'] = 1
                else:
                    pass

            striking_stats_records = get_striking_stats_records(
                fight_id=fight_id,
                fighter_id_blue=fighter_id_blue,
                fighter_id_red=fighter_id_red,
                round=round,
                data=[data_of_round_blue, data_of_round_red],
            )

            grappling_stats_records = get_grappling_stats_records(
                fight_id=fight_id,
                fighter_id_blue=fighter_id_blue,
                fighter_id_red=fighter_id_red,
                round=round,
                data=[data_of_round_blue, data_of_round_red]
            )

            control_stats_records = get_control_stats_records(
                fight_id=fight_id,
                fighter_id_blue=fighter_id_blue,
                fighter_id_red=fighter_id_red,
                round=round,
                data=[data_of_round_blue, data_of_round_red]
            )

            position_stats_records = get_position_stats_records(
                fight_id=fight_id,
                round=round,
                data=[data_of_round_blue, data_of_round_red]
            )

            insert_stats_records(
                stats=striking_stats_records,
                stats_category=StatsCategory.STRIKING,
                db_type='sqlite'
            )

            insert_stats_records(
                stats=grappling_stats_records,
                stats_category=StatsCategory.GRAPPLING,
                db_type='sqlite'
            )

            insert_stats_records(
                stats=control_stats_records,
                stats_category=StatsCategory.CONTROL,
                db_type='sqlite'
            )
            insert_stats_records(
                stats=position_stats_records,
                stats_category=StatsCategory.POSITION,
                db_type='sqlite'
            )

    except Exception as e:
        logger.error(f'fight {fight_id} - something went wrong: {e}')


"""
def get_missing_stats() -> None:
    missing_fight_ids = get_fight_ids()
    if missing_fight_ids is not None:
        with ThreadPoolExecutor(max_workers=5) as exe:
            futures = [exe.submit(insert_stats, fight_id) for fight_id in missing_fight_ids]
"""