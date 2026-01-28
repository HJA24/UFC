import numpy as np
import arviz as az
import xarray as xr
from enum import Enum
from itertools import chain
from typing import Dict, List, Optional



class Period(Enum):
    FIGHT = 0
    ROUND = 1


class Corner(Enum):
    BLUE = 'blue'
    RED  = 'red'


class CountType(Enum):
    TRIALS    = 0
    SUCCESSES = 1


class Outcomes(Enum):
    KNOCKOUT     = 0
    SUBMISSION   = 1
    DECISION     = 2
    DRAW         = 3
    NO_CONTEST   = 4
    DISQUALIFIED = 5


def get(d: Dict) -> List:
    return list(chain.from_iterable(*[
        chain.from_iterable([
            get(v) if isinstance(v, dict) else [v] if isinstance(v, str) else v for v in d.values()
        ])
    ]))


def get_stats(model: Dict) -> List[str]:
    stats = list(chain.from_iterable(
        model['striking_rate']['data']['y1'] +
        model['striking_rate']['data']['T1'] +
        model['grappling_rate']['data']['y2'] +
        model['grappling_rate']['data']['T2'] +
        model['striking_accuracy']['data']['n3'] +
        model['striking_accuracy']['data']['N3'] +
        model['grappling_accuracy']['data']['n4'] +
        model['grappling_accuracy']['data']['N4'] +
        model['knockdowns_and_knockouts']['data']['n5'] +
        model['knockdowns_and_knockouts']['data']['N5'] +
        model['strike_target']['data']['n6'] +
        model['strike_target']['data']['N6']
    ))

    return list(set([
        stat.split('_')[0] for stat in stats
    ]))


def get_skills(model: Dict) -> Dict:
    K1 = model['striking_rate']['K']
    K2 = model['grappling_rate']['K']
    K3 = model['striking_accuracy']['K']
    K4 = model['grappling_accuracy']['K']
    K5 = model['knockdowns_and_knockouts']['K']
    K6 = model['strike_target']['K']

    skills = model['intercept']['parameters']['gamma']

    skills_K1 = skills[:K1]
    skills_K2 = skills[K1:K1 + K2]
    skills_K3 = skills[K1 + K2:K1 + K2 + K3]
    skills_K4 = skills[K1 + K2 + K3:K1 + K2 + K3 + K4]
    skills_K5 = skills[K1 + K2 + K3 + K4:K1 + K2 + K3 + K4 + K5]
    skills_K6 = skills[K1 + K2 + K3 + K4 + K5:K1 + K2 + K3 + K4 + K5 + K6]

    return {
        'K1': skills_K1,
        'K2': skills_K2,
        'K3': skills_K3,
        'K4': skills_K4,
        'K5': skills_K5,
        'K6': skills_K6
    }


def get_parameters(model: Dict) -> Dict:
    K1 = model['striking_rate']['parameters']['lambda']
    K2 = model['grappling_rate']['parameters']['lambda'] 
    K3 = model['striking_accuracy']['parameters']['lambda'] 
    K4 = model['grappling_accuracy']['parameters']['lambda'] 
    K5 = model['knockdowns_and_knockouts']['parameters']['lambda'] 
    K6 = model['strike_target']['parameters']['lambda']

    gamma = model['intercept']['parameters']['gamma']
    
    return {
        'K1': K1,
        'K2': K2,
        'K3': K3,
        'K4': K4,
        'K5': K5,
        'K6': K6,
        'gamma': gamma
    }


def clock2n_secs(mmss: str) -> Optional[int]:
    try:
        minutes, seconds = mmss.split(':')
        return int(minutes) * 60 + int(seconds)
    except AttributeError:
        return None


def n_secs2clock(n_seconds: int) -> str:
    minutes, seconds = divmod(n_seconds, 60)

    if seconds < 10:
        seconds = f'0{seconds}'

    return f'{minutes}:{seconds}'


def extract(fit: az.InferenceData, group: str, parameter: str) -> xr.DataArray:
    return fit[group][parameter].stack(
        __sample__=[
            'chain',
            'draw'
        ]
    )


def octagonal_linespace(n: int, start: float=0, stop: float=1) -> np.array:
    """
    Return 'n' equally-spaced points along the perimeter of a regular octagon
    """

    vertices = 8

    perimeter = stop - start
    edge = perimeter / vertices
    angle = 2.0 * np.pi / vertices
    radius = 0.5 * edge / np.sin(0.5 * angle)

    k = np.arange(vertices + 1)
    polygon = radius * np.exp(1j * angle * k)

    t = start + (perimeter * np.arange(n) / n)
    t = np.mod(t, perimeter)

    idx = np.floor_divide(t, edge).astype(np.int64)
    frac = (t - idx * edge) / edge

    p0 = polygon[idx]
    p1 = polygon[idx + 1]
    pts = p0 + (p1 - p0) * frac

    return np.array([pts.real, pts.imag]).T

