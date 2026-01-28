import os
import json
import logging
import pandas as pd
import numpy as np
from datetime import datetime
from scripts.sample import sample
from scripts.helper import extract
from scripts.diagnostics import check_diagnostics, plot_ppc
from scripts.stats import get_stats
from scripts.database.database import get_scorecards, insert_beta, insert_cut_point
from typing import Dict, List, Tuple


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


PATH_MODELS = '/Users/huibmeulenbelt/PycharmProjects/ufc/models/judges/'


def judges_idx(df: pd.DataFrame) -> Dict:
    judges = df['judge_id'].unique().tolist()

    return dict([
        (j, x + 1) for x, j in enumerate(dict.fromkeys(judges))
    ])


def scores_idx(scores: List[int]) -> Dict:
    return dict([
        (s, x + 1) for x, s in enumerate(dict.fromkeys(scores))
    ])


def create_coords_and_dims(Y: int, K: List[str], J: List[int]) -> Tuple:
    coords = {
        'c': list(range(1, Y)),
        'k': K,
        'j': J
    }

    dims = {
        'cut_points': ['c'],
        'beta':       ['k', 'j']
    }

    return coords, dims


def get_deltas(judge_id: int, relevant_stats: List[str]) -> pd.DataFrame:
    logger.info(f'judge {judge_id} - collecting all relevant data {tuple(relevant_stats)} for his/her decision(s)')

    scorecards = get_scorecards(judge_id=judge_id)
    fight_ids  = scorecards['fight_id'].unique().tolist()

    stats = get_stats(stats=relevant_stats, fighter_id=None, opponent_id=None, fight_ids=fight_ids)
    stats = stats.drop_duplicates().pivot(
        index=['fight_id', 'fighter_id', 'round'],
        columns='stat',
        values='n'
    )

    scorecards = scorecards.set_index(['fight_id', 'fighter_id', 'round'])
    scorecards = pd.merge(scorecards, stats, left_index=True, right_index=True)

    df = (
        scorecards.groupby(['fight_id', 'round'])
                  .agg(['first', 'last'])
                  .rename(columns={
                            'first': 'blue',
                            'last': 'red'
                        })
    )
    df = df.xs('blue', axis=1, level=1).sub(df.xs('red', axis=1, level=1))
    df = df[df['n_points'] != 0]

    df['judge_id'] = judge_id

    return df


def process_data(df: pd.DataFrame, y: List[int], K: List[str]) -> Dict:
    judge_ids = judges_idx(df=df)
    score_ids = scores_idx(scores=y)

    processed_data = {
        'Y': len(y),
        'N': len(df),
        'K': len(K),
        'J': len(judge_ids),
        'jj': np.array(df['judge_id'].apply(lambda x: judge_ids[x])),
        'X': np.array(df[K]),
        'y': np.array(df['n_points'].apply(lambda x: score_ids[x]))
    }

    return processed_data


model_id  = 9
judge_ids = [
    32,
    14,
    200,
]
ts = int(datetime.now().timestamp())


if __name__ == '__main__':
    logger.info(f'reading specifics of model #{model_id}')

    models = json.load(open(os.path.join(PATH_MODELS, 'models.json')))
    model  = models[str(model_id)]

    model_path = model['path']
    K = model['K']
    y = model['y']

    df = pd.concat([
        get_deltas(judge_id=judge_id, relevant_stats=K) for judge_id in judge_ids
    ]).reset_index(drop=True)

    data = process_data(
        df=df,
        y=list(y.values()),
        K=K
    )

    J = df['judge_id'].drop_duplicates().sort_values().tolist()
    Y = len(y)
    C = list(range(1, Y))

    coords, dims = create_coords_and_dims(
        Y=Y,
        K=K,
        J=J
    )

    fit = sample(
        data=data,
        path=model_path,
        observed_data={'y': data['y']},
        posterior_predictive='y_hat',
        dims=dims,
        coords=coords
    )

    diagnostics = check_diagnostics(
        fit=fit,
        parameters=[
            'beta',
            'cut_points'
        ]
    )

    if diagnostics:
        plot_ppc(fit=fit, pairs={'y': 'y_hat'})

        betas      = extract(fit=fit, parameter='beta')
        cut_points = extract(fit=fit, parameter='cut_points')

        for j in J:
            for k in K:
                posterior = betas.sel(j=j, k=k).values
                beta = {
                    'judge_id': j,
                    'k': k,
                    'posterior': posterior,
                    'model_id': model_id,
                    'ts': ts
                }

                insert_beta(beta=beta)

        for c in C:
            posterior = cut_points.sel(c=c).values
            cut_point = {
                'c': c,
                'posterior': posterior,
                'model_id': model_id,
                'ts': ts
            }

            insert_cut_point(cut_point=cut_point)