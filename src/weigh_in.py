import logging
from itertools import chain
import pandas as pd
import numpy as np
from collections import Counter
from stats.stats import get_stats
from typing import Any, Dict, List, Tuple


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def fighters_idx(df: pd.DataFrame) -> Dict:
    fighters = df[[
        'blue',
        'red'
    ]].astype(int).stack().dropna().values

    c = Counter(fighters).most_common(1)
    fighters = np.append(c[0][0], fighters)

    return dict([
        (y, x + 1) for x, y in enumerate(dict.fromkeys(fighters))
    ])


def fights_idx(df: pd.DataFrame) -> Dict:
    fights = df['fight_id'].unique()

    return dict([
        (y, x + 1) for x, y in enumerate(dict.fromkeys(fights))
    ])


def get_data_between_fighters(blue: int, red: int, stats: List[str], **kwargs: Any) -> pd.DataFrame:
    stats_blue = get_stats(
        stats=stats,
        fighter_id=blue,
        opponent_id=red,
        **kwargs
    )
    
    stats_red = get_stats(
        stats=stats,
        fighter_id=red,
        opponent_id=blue,
        **kwargs
    )
    
    stats_blue = stats_blue.pivot(
        index=['fight_id', 'round'],
        columns='stat',
        values='n'
    )
    stats_blue = stats_blue[stats].add_suffix('_blue')

    stats_red = stats_red.pivot(
        index=['fight_id', 'round'],
        columns='stat',
        values='n'
    )
    stats_red = stats_red[stats].add_suffix('_red')

    stats = pd.concat([
        stats_blue,
        stats_red
    ], axis=1).reset_index()

    stats['blue'] = blue
    stats['red']  = red

    return stats


def get_data(event_id: int, fight_id: int, h2hs: List[Tuple[int, int]], stats: List[str], **kwargs: Any) -> pd.DataFrame:
    df = pd.DataFrame()

    n = len(h2hs)
    i = 0

    for (blue, red) in h2hs:
        logger.info(f'event: {event_id} - fight: {fight_id} - collecting history of pool - {i/n:.1%}')
        df = pd.concat([
            df,
            get_data_between_fighters(
                blue=blue,
                red=red,
                stats=stats,
                **kwargs
            )
        ], axis=0)
        i += 1

    return df.dropna()


def get_relevant_stats(model: Dict) -> List[str]:
    stats = list(chain.from_iterable(
        model['stan']['striking_rate']['data']['y1'] +
        model['stan']['striking_rate']['data']['T1'] +
        model['stan']['grappling_rate']['data']['y2'] +
        model['stan']['grappling_rate']['data']['T2'] +
        model['stan']['striking_accuracy']['data']['n3'] +
        model['stan']['striking_accuracy']['data']['N3'] +
        model['stan']['grappling_accuracy']['data']['n4'] +
        model['stan']['grappling_accuracy']['data']['N4'] +
        model['stan']['knockdowns_and_knockouts']['data']['n5'] +
        model['stan']['knockdowns_and_knockouts']['data']['N5'] +
        model['stan']['strike_target']['data']['n6'] +
        model['stan']['strike_target']['data']['N6']
    ))

    stats = list(set([stat.split('_')[0] for stat in stats]))

    return stats


def process_data(df: pd.DataFrame, model: Dict) -> Dict:
    fighter_ids = fighters_idx(df=df)
    n_fighters  = len(fighter_ids)

    K1 = model['striking_rate']['K']
    K2 = model['grappling_rate']['K']
    K3 = model['striking_accuracy']['K']
    K4 = model['grappling_accuracy']['K']
    K5 = model['knockdowns_and_knockouts']['K']
    K6 = model['strike_target']['K']

    y1_keys = list(chain.from_iterable(model['striking_rate']['data']['y1']))
    T1_keys = list(chain.from_iterable(model['striking_rate']['data']['T1']))
    y2_keys = list(chain.from_iterable(model['grappling_rate']['data']['y2']))
    T2_keys = list(chain.from_iterable(model['grappling_rate']['data']['T2']))
    n3_keys = list(chain.from_iterable(model['striking_accuracy']['data']['n3']))
    N3_keys = list(chain.from_iterable(model['striking_accuracy']['data']['N3']))
    n4_keys = list(chain.from_iterable(model['grappling_accuracy']['data']['n4']))
    N4_keys = list(chain.from_iterable(model['grappling_accuracy']['data']['N4']))
    n5_keys = list(chain.from_iterable(model['knockdowns_and_knockouts']['data']['n5']))
    N5_keys = list(chain.from_iterable(model['knockdowns_and_knockouts']['data']['N5']))
    n6_keys = list(chain.from_iterable(model['strike_target']['data']['n6']))
    N6_keys = list(chain.from_iterable(model['strike_target']['data']['N6']))

    blue = df['blue'].apply(lambda x: fighter_ids[x]).values
    red  = df['red'].apply(lambda x: fighter_ids[x]).values

    d = {
        'N': len(df),
        'n_fighters': n_fighters,
        'blue': blue,
        'red': red,
        'K1': K1,
        'y1': df[y1_keys].values.reshape(2, K1, -1),
        'T1': df[T1_keys].values.reshape(2, K1, -1),
        'K2': K2,
        'y2': df[y2_keys].values.reshape(2, K2, -1),
        'T2': df[T2_keys].values.reshape(2, K2, -1),
        'K3': K3,
        'n3': df[n3_keys].values.reshape(2, K3, -1),
        'N3': df[N3_keys].values.reshape(2, K3, -1),
        'K4': K4,
        'n4': df[n4_keys].values.reshape(2, K4, -1),
        'N4': df[N4_keys].values.reshape(2, K4, -1),
        'K5': K5,
        'n5': df[n5_keys].values.reshape(2, K5, -1),
        'N5': df[N5_keys].values.reshape(2, K5, -1),
        'K6': K6,
        'n6': df[n6_keys].values.reshape(2, K6, -1),
        'N6': df[N6_keys].values.reshape(2, K6, -1),
        'fighter_idx': fighter_ids
    }

    return d


def check_binomial_data(df: pd.DataFrame, stats: Dict) -> bool:
    ns = list(chain(*stats['n']))
    Ns = list(chain(*stats['N']))

    for i, j in zip(ns, Ns):
        n = np.array(df[i])
        N = np.array(df[j])
        n_le_N = np.all(n <= N)

        if not n_le_N:
            n_violations = np.sum(n > N)
            logger.info(f'binomial criteria is {n_violations}x not satisfied for n: {i} and N: {j}')
            return False

    return True

