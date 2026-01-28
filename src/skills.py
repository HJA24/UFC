import numpy as np
import arviz as az
import xarray as xr
import scipy.special as ss
from scripts.helper import extract
from typing import Dict


def extract_skill(gamma: xr.DataArray, lambda_i: xr.DataArray, lambda_j: xr.DataArray, skill: str) -> np.ndarray:
    skill = ss.expit(gamma.sel(y=skill) + lambda_i.sel(k=f'{skill}_att') - lambda_j.sel(k=f'{skill}_def'))

    return skill.values


def build_skills(fit: az.InferenceData, blue: int, red: int) -> Dict:
    skills = {}

    gamma       = extract(fit=fit, group='posterior', parameter='gamma')
    lambda_blue = extract(fit=fit, group='posterior', parameter='lambda').sel(fighter_id=blue)
    lambda_red  = extract(fit=fit, group='posterior', parameter='lambda').sel(fighter_id=red)

    abbreviations = [
        'ssr',
        'sgr',
        'tdr',
        'smr',
        'rvr',
        'sur',
        'ssha',
        'sgha',
        'ssba',
        'sgba',
        'tda',
        'sma',
        'skd',
        'sko',
        'gko',
        'sst',
        'sgt'
    ]

    for abbreviation in abbreviations:
        skill_blue = extract_skill(
            gamma=gamma,
            lambda_i=lambda_blue,
            lambda_j=lambda_red,
            skill=abbreviation
        )

        skill_red = extract_skill(
            gamma=gamma,
            lambda_i=lambda_red,
            lambda_j=lambda_blue,
            skill=abbreviation
        )
        skills[f'{abbreviation}_blue'] = skill_blue
        skills[f'{abbreviation}_red']  = skill_red

    return skills
