import os
import logging
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
from scripts.p import plot_p
from scripts.scrape.ufc.events import get_upcoming_event_id
from scripts.scrape.ufc.fights import get_fight_ids
from scripts.scrape.ufc.fighters import get_fighter_names
from scripts.kelly.kelly import pdf, R, kelly
from scripts.database.database import get_config_id, get_outcome_description, check_if_edges_is_in_db, check_if_f_is_in_db, get_p, insert_f
# from events import get_credentials, create_service, create_event, add_event, upload_to_drive
from typing import Dict, List, Optional


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


PATH_P = '/Users/huibmeulenbelt/PycharmProjects/ufc/data/p/output'


"""
get_credentials()
calendar_service = create_service(application='calendar')
drive_service    = create_service(application='drive')
"""

def solve(fight_ids: List[int], market_ids: List[int], odds: np.ndarray, ps: np.ndarray, cc: bool, alpha: Optional[float]) -> List[Dict]:
    ts = int(datetime.now().timestamp())

    n_fights = len(ps)
    p_mean   = np.nanmean(ps, axis=1)

    X = np.eye(2)
    epi = np.array([pdf(p=p_mean, X=X)])

    rs = R(odds=odds, m=n_fights)

    try:
        fs = kelly(
            epi=epi,
            pi=ps,
            cc=cc,
            dc=False,
            alpha=alpha,
            rs=rs,
            func_piece_error=0.05,
            mip_focus=3
        )
    except Exception as e:
        logger.error(e)
        fs = np.zeros(2 * n_fights)

    return [{
        'fight_id': int(fight_id),
        'market_id': market_id,
        'f': f,
        'cc': cc,
        'alpha': alpha,
        'config_id': config_id,
        'ts': ts
    } for fight_id, market_id, f in zip(fight_ids, market_ids, fs)]


def watch(fight_ids: List[int], market_ids: List[int]) -> None:
    p    = []
    odds = []

    for fight_id in fight_ids:
        odds_fight = []
        blue_name, red_name = get_fighter_names(fight_id=fight_id)

        print(f'fight: {fight_id} - {blue_name} vs {red_name}')

        for market_id in market_ids:
            p_outcome = get_p(
                fight_id=fight_id,
                market_id=market_id,
                config_id=config_id
            )

            p.append(p_outcome)

            description = get_outcome_description(outcome_id=market_id)
            odds_market = float(input(f'{description} - odds:\t'))
            odds_fight.append(odds_market)

            # plot_p
            plot_p(p=p_outcome, odds=odds_market)
            plt.savefig(os.path.join(PATH_P, f'{fight_id}-{market_id}.jpeg'))

    p = np.array(p)
    odds = np.array(odds_fight).flatten()
    fight_ids = np.repeat(fight_ids, len(market_ids)).tolist()

    solutions = solve(
        fight_ids=fight_ids,
        market_ids=market_ids,
        odds=odds,
        ps=p,
        cc=True,
        alpha=alpha
    )

    for s in solutions:
        fight_id = s['fight_id']
        market_id = s['market_id']

        present_in_db = check_if_f_is_in_db(
            fight_id=fight_id,
            market_id=market_id,
            config_id=config_id
        )

        if not present_in_db:
            insert_f(f=s)

        if s['f'] <= 0.01:
            continue


        """
        s['dt'] = dt
        s['competition'] = competition
        s['odds'] = o
        s['bookie'] = bookie
        s['method'] = model

        fid = upload_to_drive(
            service=drive_service,
            match_id=match_id,
            home_id=home_id
        )
        """


fighting_id = 3
judging_id  = 9
config_id   = get_config_id(fighting_id=fighting_id, judging_id=judging_id)

market = 'winner'
period = 'fight'


cc = True
alpha = 0.4

if __name__ == "__main__":
    event_id = get_upcoming_event_id()
    logger.info(f'event: {event_id} - collecting fights')
    fight_ids = get_fight_ids(event_id=event_id)
    fight_ids_with_edges = []

    for fight_id in fight_ids:
        present_in_db = check_if_edges_is_in_db(fight_id=fight_id, model_id=fighting_id)

        if present_in_db:
            fight_ids_with_edges.append(fight_id)

    for fight_id in fight_ids_with_edges:
        watch(fight_ids=[fight_id], market_ids=[1, 34])

