import json
import numpy as np
from dataclasses import dataclass, asdict
from datetime import datetime
from collections import defaultdict
from scripts.database.database import get_prediction_type_ids, get_markov_id, get_body_part, get_submission_technique
from scripts.markov.fight import Fight
from scripts.judging.decision import Judges
from typing import Any, Dict, List, Optional, Tuple


PATH_PREDICTIONS = '/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/kelly/markets.json'
PREDICTIONS      = json.load(open(PATH_PREDICTIONS))


@dataclass
class Prediction:
    fight_id: int
    market_id: int
    p: Optional[bytes]
    config_id: int
    ts: int

    def to_dict(self):
        return asdict(self)


def extract(round: Optional[int], minute: Optional[int], seconds: Optional[int], t: int, dt: float):
    steps_per_round = t * dt

    i = (round - 1) * steps_per_round
    j = i + steps_per_round

    if minute is not None:
        steps_per_minute = 60 * dt
        i += (minute - 1) * steps_per_minute
        j = i + steps_per_minute

    if seconds == 10:                                 # first 10 seconds of fight
        i = 0
        j = 10

    if seconds == -10:                                # last 10 seconds of fight
        i = -11
        j = -1

    return np.arange(i, j)


def get_winners(market_ids: List[int], p_blue: np.ndarray, p_red: np.ndarray, t: int, dt: float) -> Dict:
    markets = {}

    for market_id in market_ids:
        market = MARKETS[market_id]

        fighter = market['fighter']
        period  = market['period']
        round   = market['round']
        minute  = market['minute']
        seconds = market['seconds']

        if fighter == 'blue':
            p = p_blue

        elif fighter == 'red':
            p = p_red

        if period == 'fight':
            markets[market_id] = np.sum(p, axis=1)
            continue

        elif period == 'inside':
            markets[market_id] = np.sum(p[:-1], axis=1)
            continue

        idx = extract(
            round=round,
            minute=minute,
            seconds=seconds,
            t=t,
            dt=dt
        )
        markets[market_id] = np.sum(p[idx], axis=1)

    return markets


def get_methods(market_ids: List[int], p_blue: Dict, p_red: Dict, t: int, dt: float) -> Dict:
    markets = {}

    for market_id in market_ids:
        market = MARKETS[market_id]

        method  = market['sub_category']
        fighter = market['fighter']
        period  = market['period']
        round   = market['round']
        minute  = market['minute']
        seconds = market['seconds']

        if fighter == 'blue':
            p = p_blue[method]

        elif fighter == 'red':
            p = p_red[method]

        else:
            p = p_blue[method] + p_red[method]


        if period == 'fight':
            markets[market_id] = np.sum(p, axis=1)
            continue

        if method == 'decision':
            markets[market_id] = p
            continue

        idx = extract(
            round=round,
            minute=minute,
            seconds=seconds,
            t=t,
            dt=dt
        )
        markets[market_id] = np.sum(p[idx], axis=1)

    return markets


def get_decisions(market_ids: List[int], p_blue: Dict, p_red: Dict) -> Dict:
    markets = {}

    for market_id in market_ids:
        market = MARKETS[market_id]

        decision = market['sub_category']
        fighter  = market['fighter']

        if fighter == 'blue':
            p = p_blue[decision]

        elif fighter == 'red':
            p = p_red[decision]

        markets[market_id] = p

    return markets


def get_durations(market_ids: List[int], p_round: np.ndarray, p_over_half_round: np.ndarray) -> Dict:
    markets = {}

    for market_id in market_ids:
        market = MARKETS[market_id]

        operator = market['sub_category']
        round    = market['round']

        if operator == 'eq':
            p = 1 - p_round ** round

        elif operator == 'geq':
            p = p_round ** (round - 1)

        elif operator == 'less':
            p = 1 - p_round ** (round - 1)

        elif operator == 'over':
            p = p_round ** np.floor(round) * p_over_half_round

        elif operator == 'under':
            p = 1 - p_round ** np.floor(round) * p_over_half_round

        markets[market_id] = p

    return markets


def get_differentials(market_ids: List[int], p_blue: Dict, p_red: Dict) -> Dict:
    markets = {}

    for market_id in market_ids:
        market = MARKETS[market_id]

        underlying = market['sub_category']
        fighter    = market['fighter']

        if fighter == 'blue':
            p = p_blue[underlying]

        elif fighter == 'red':
            p = p_red[underlying]

        markets[market_id] = p

    return markets


def get_comebacks(market_ids: List[int],p_blue: Dict, p_red: Dict) -> Dict:
    markets = {}

    market_ids = get_market_ids(category='comeback')

    for market_id in market_ids:
        market = MARKETS[market_id]

        underlying = market['sub_category']
        fighter    = market['fighter']

        if fighter == 'blue':
            p = p_blue[underlying]

        elif fighter == 'red':
            p = p_red[underlying]

        markets[market_id] = p

    return markets


def get_knockouts(market_ids: List[int], p_blue: Dict, p_red: Dict) -> Dict:
    markets = {}

    for market_id in market_ids:
        market = MARKETS[market_id]

        method  = market['sub_category']
        fighter = market['fighter']

        if fighter == 'blue':
            p = p_blue[method]

        elif fighter == 'red':
            p = p_red[method]

        markets[market_id] = p

    return markets


def get_submissions(market_ids: List[int], p_blue: Dict, p_red: Dict) -> Dict:
    markets = {}

    for market_id in market_ids:
        market = MARKETS[market_id]

        method  = market['sub_category']
        fighter = market['fighter']

        if fighter == 'blue':
            p = p_blue[method]

        elif fighter == 'red':
            p = p_red[method]

        markets[market_id] = p

    return markets


def get_totals(market_ids: List[int], p_blue: Dict, p_red: Dict) -> Dict:
    markets = {}

    for market_id in market_ids:
        market = MARKETS[market_id]

        method  = market['sub_category']
        fighter = market['fighter']
        n = market['n']

        if fighter == 'blue':
            p = p_blue[method][n]

        elif fighter == 'red':
            p = p_red[method][n]

        markets[market_id] = p

    return markets


def build_p_knockouts_by(market_ids: List[int], fight: Fight) -> Tuple[Dict, Dict]:
    p_blue = defaultdict(lambda: np.zeros(fight.n_samples))
    p_red  = defaultdict(lambda: np.zeros(fight.n_samples))
    j_blue = []
    j_red  = []

    for market_id in market_ids:
        market = MARKETS[market_id]

        stats   = market['stat']
        fighter = market['fighter']

        for stat in stats:
            id = get_markov_id(abbreviation=stat, fighter=fighter)
            i  = fight.nodes_idx[id]

            if fighter == 'blue':
                j_blue.append(i)
            elif fighter == 'red':
                j_red.append(i)

    p_tau_minus_1_blue = fight.p_X_tau_minus_1(j=j_blue, k=fight.i_knockout_blue)
    p_tau_minus_1_red  = fight.p_X_tau_minus_1(j=j_red,  k=fight.i_knockout_red)

    for i, j in enumerate(j_blue):
        body_part = get_body_part(markov_id=j)
        p_blue[body_part] += p_tau_minus_1_blue[:, i]

    for i, j in enumerate(j_red):
        body_part = get_body_part(markov_id=j)
        p_red[body_part] += p_tau_minus_1_red[:, i]

    return p_blue, p_red


def build_p_submissions_by(market_ids: List[int], fight: Fight) -> Tuple[Dict, Dict]:
    p_blue = defaultdict(lambda: np.zeros(fight.n_samples))
    p_red  = defaultdict(lambda: np.zeros(fight.n_samples))
    j_blue = []
    j_red = []

    for market_id in market_ids:
        market = MARKETS[market_id]

        stats   = market['stat']
        fighter = market['fighter']

        for stat in stats:
            id = get_markov_id(abbreviation=stat, fighter=fighter)
            i = fight.nodes_idx[id]

            if fighter == 'blue':
                j_blue.append(i)
            elif fighter == 'red':
                j_red.append(i)

    p_tau_minus_1_blue = fight.p_X_tau_minus_1(j=j_blue, k=fight.i_submission_blue)
    p_tau_minus_1_red = fight.p_X_tau_minus_1(j=j_red,   k=fight.i_submission_red)

    for i, j in enumerate(j_blue):
        choke = get_submission_technique(markov_id=j)
        p_blue[choke] += p_tau_minus_1_blue[:, i]

    for i, j in enumerate(j_red):
        choke = get_submission_technique(markov_id=j)
        p_red[choke] += p_tau_minus_1_red[:, i]

    return p_blue, p_red


def build_p_differentials(market_ids: List[int], fight: Fight) -> Tuple[Dict, Dict]:
    p_blue = {}
    p_red  = {}

    for market_id in market_ids:
        market = MARKETS[market_id]

        underlying = market['sub_category']
        fighter = market['fighter']

        if fighter == 'blue':
            if underlying == 'strikes':
                p_blue[underlying] = fight.p_strikes_gt_blue

            elif underlying == 'takedowns':
                p_blue[underlying] = fight.p_takedowns_gt_blue

            elif underlying == 'chokes':
                p_blue[underlying] = fight.p_chokes_gt_blue

            elif underlying == 'control':
                p_blue[underlying] = fight.p_misc_control_gt_blue

            elif underlying == 'ground control':
                p_blue[underlying] = fight.p_ground_control_gt_blue

        elif fighter == 'red':
            if underlying == 'strikes':
                p_red[underlying] = fight.p_strikes_gt_red

            elif underlying == 'takedowns':
                p_red[underlying] = fight.p_takedowns_gt_red

            elif underlying == 'chokes':
                p_red[underlying] = fight.p_chokes_gt_red

            elif underlying == 'control':
                p_red[underlying] = fight.p_misc_control_gt_red

            elif underlying == 'ground control':
                p_red[underlying] = fight.p_ground_control_gt_red

    return p_blue, p_red


def build_p_totals(market_ids: List[int], fight: Fight, **kwargs: Any) -> Tuple[Dict, Dict]:
    n_strikes    = kwargs.get('n_strikes', 100)
    n_takedowns  = kwargs.get('n_takedowns', 25)
    n_chokes     = kwargs.get('n_chokes', 5)
    t_control        = kwargs.get('t_control', 22.5)
    t_ground_control = kwargs.get('t_ground_control', 22.5)

    p_blue = defaultdict(dict)
    p_red  = defaultdict(dict)

    n_control        = t_control * 60 * fight.dt
    n_ground_control = t_ground_control * 60 * fight.dt

    p_strikes_blue   = fight.p_strikes_gt_x_blue(x=n_strikes)
    p_takedowns_blue = fight.p_takedowns_gt_x_blue(x=n_takedowns)
    p_chokes_blue    = fight.p_chokes_gt_x_blue(x=n_chokes)
    p_control_blue   = fight.p_misc_control_gt_x_blue(x=n_control)
    p_ground_control_blue = fight.p_ground_control_gt_x_blue(x=n_ground_control)

    p_strikes_red   = fight.p_strikes_gt_x_red(x=n_strikes)
    p_takedowns_red = fight.p_takedowns_gt_x_red(x=n_takedowns)
    p_chokes_red    = fight.p_chokes_gt_x_red(x=n_chokes)
    p_control_red   = fight.p_misc_control_gt_x_red(x=n_control)
    p_ground_control_red = fight.p_ground_control_gt_x_red(x=n_ground_control)


    for market_id in market_ids:
        market = MARKETS[market_id]

        underlying = market['sub_category']
        fighter    = market['fighter']
        n = market['n']

        idx = np.arange(n)

        if fighter == 'blue':
            if underlying == 'strikes':
                p_blue[underlying][n] = 1 - np.sum(p_strikes_blue[:, :, idx], axis=(1, 2))

            elif underlying == 'takedowns':
                p_blue[underlying][n] = 1 - np.sum(p_takedowns_blue[:, :, idx], axis=(1, 2))

            elif underlying == 'chokes':
                p_blue[underlying][n] = 1 - np.sum(p_chokes_blue[:, :, idx], axis=(1, 2))

            elif underlying == 'control':
                p_blue[underlying][n] = 1 - np.sum(p_control_blue[:, :, idx], axis=(1, 2))

            elif underlying == 'ground control':
                p_blue[underlying][n] = 1 - np.sum(p_ground_control_blue[:, :, idx], axis=(1, 2))

        elif fighter == 'red':
            if underlying == 'strikes':
                p_red[underlying][n] = 1 - np.sum(p_strikes_red[:, :, idx], axis=(1, 2))

            elif underlying == 'takedowns':
                p_red[underlying][n] = 1 - np.sum(p_takedowns_red[:, :, idx], axis=(1, 2))

            elif underlying == 'chokes':
                p_red[underlying][n] = 1 - np.sum(p_chokes_red[:, :, idx], axis=(1, 2))

            elif underlying == 'control':
                p_red[underlying][n] = 1 - np.sum(p_control_red[:, :, idx], axis=(1, 2))

            elif underlying == 'ground control':
                p_red[underlying][n] = 1 - np.sum(p_ground_control_red[:, :, idx], axis=(1, 2))

    return p_blue, p_red


def create_markets(fight_id: int, config_id: int, fight: Fight, judges: Judges) -> List[Dict]:
    markets = []

    winner_ids     = get_market_ids(category='winner')
    method_ids     = get_market_ids(category='method')
    decision_ids   = get_market_ids(category='decision')
    duration_ids   = get_market_ids(category='duration')
    diff_ids       = get_market_ids(category='differentials')
    total_ids      = get_market_ids(category='totals')
    comeback_ids   = get_market_ids(category='comeback')
    knockout_ids   = get_market_ids(category='knockout')
    submission_ids = get_market_ids(category='submission')

    t  = fight.t
    dt = fight.dt

    p_round = fight.p_round
    p_over_half_round = fight.p_over_half_round
    p_to_the_distance = fight.p_to_the_distance

    # methods
    p_knockout_blue   = fight.p_knockout_blue
    p_submission_blue = fight.p_submission_blue
    p_knockout_red    = fight.p_knockout_red
    p_submission_red  = fight.p_submission_red

    p_methods_blue = {
        'knockout':   p_knockout_blue,
        'submission': p_submission_blue,
    }

    p_methods_red = {
        'knockout':   p_knockout_red,
        'submission': p_submission_red,
    }

    # decisions
    p_split_blue     = judges.p_split_blue
    p_unanimous_blue = judges.p_unanimous_blue
    p_split_red      = judges.p_split_red
    p_unanimous_red  = judges.p_unanimous_red

    p_decision_blue = {
        'split':     p_to_the_distance * p_split_blue,
        'unanimous': p_to_the_distance * p_unanimous_blue
    }

    p_decision_red = {
        'split':     p_to_the_distance * p_split_red,
        'unanimous': p_to_the_distance * p_unanimous_red
    }

    p_decision = {
        'blue': p_to_the_distance * (p_split_blue + p_unanimous_blue),
        'red':  p_to_the_distance * (p_split_red + p_unanimous_red)
    }

    # winners
    p_winner_blue = np.hstack([p_knockout_blue + p_submission_blue, p_decision_blue], axis=1)
    p_winner_red  = np.hstack([p_knockout_red  + p_submission_red, p_decision_red],   axis=1)

    # knockouts / submissions by
    p_knockout_by_blue, p_knockout_by_red     = build_p_knockouts_by(market_ids=knockout_ids,     fight=fight)
    p_submission_by_blue, p_submission_by_red = build_p_submissions_by(market_ids=submission_ids, fight=fight)

    # stats
    p_diff_blue, p_diff_red   = build_p_differentials(market_ids=diff_ids, fight=fight)
    p_total_blue, p_total_red = build_p_totals(market_ids=total_ids, fight=fight)

    # comebacks
    p_comeback_blue, p_comeback_red = build_p_comebacks(market_ids=comeback_ids, fight=fight, p_decision=p_decision)

    winner_markets = get_winners(
        market_ids=winner_ids,
        p_blue=p_winner_blue,
        p_red=p_winner_red,
        t=t,
        dt=dt
    )

    method_markets = get_methods(
        market_ids=method_ids,
        p_blue=p_methods_blue,
        p_red=p_methods_red,
        t=t,
        dt=dt
    )

    decision_markets = get_decisions(
        market_ids=decision_ids,
        p_blue=p_decision_blue,
        p_red=p_decision_red
    )

    duration_markets = get_durations(
        market_ids=duration_ids,
        p_round=p_round,
        p_over_half_round=p_over_half_round
    )

    differential_markets = get_differentials(
        market_ids=diff_ids,
        p_blue=p_diff_blue,
        p_red=p_diff_red
    )

    total_markets = get_totals(
        market_ids=total_ids,
        p_blue=p_total_blue,
        p_red=p_total_red
    )

    knockout_markets = get_knockouts(
        market_ids=knockout_ids,
        p_blue=p_knockout_by_blue,
        p_red=p_knockout_by_red
    )

    submission_markets = get_submissions(
        market_ids=submission_ids,
        p_blue=p_submission_by_blue,
        p_red=p_submission_by_red
    )

    comeback_markets = get_comebacks(
        market_ids=comeback_ids,
        p_blue=p_comeback_blue,
        p_red=p_comeback_red
    )

    combined = [
        winner_markets,
        method_markets,
        decision_markets,
        duration_markets,
        differential_markets,
        total_markets,
        knockout_markets,
        submission_markets,
        comeback_markets
    ]

    ts = int(datetime.now().timestamp())

    for market in combined:
        for market_id, p in market.items():
            markets.append(Market(
                fight_id=fight_id,
                market_id=market_id,
                p=bytes(p) if p is not None else None,
                config_id=config_id,
                ts=ts
            ))

    return [market.to_dict() for market in markets]

