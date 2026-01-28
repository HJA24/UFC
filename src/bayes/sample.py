import numpy as np
import arviz as az
from dataclasses import dataclass,
from configparser import ConfigParser
from cmdstanpy import CmdStanModel
from helper import get_skills, get_parameters
from typing import Any, Dict, Optional, Tuple


PATH_CONFIG = '/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/bayes/sampler.ini'


@dataclass(frozen=True, slots=True)
class SamplerConfig:
    n_chains:      int
    adapt_delta:   float
    max_treedepth: int
    seed:          Optional[int] = None

    @classmethod
    def from_ini(cls):
        parser = ConfigParser()
        parser.read(PATH_CONFIG)

        config = parser["sampler"]

        return cls(
            n_chains=config.getint('n_chains'),
            adapt_delta=config.getfloat('adapt_delta'),
            max_treedepth=config.getint("max_treedepth"),
            seed=config.getint('seed') if config.get('seed') else None
        )


def create_coords_and_dims(fighter_idx: Dict, model: Dict, N: int) -> Tuple:
    skills     = get_skills(model=model)
    parameters = get_parameters(model=model)

    coords = {
        'k': parameters['K1'] + parameters['K2'] + parameters['K3'] + parameters['K4'] + parameters['K5'] + parameters['K6'],
        'y': parameters['gamma'],
        'C': np.arange(1, 3),
        'N': np.arange(1, N + 1),
        'K1': skills['K1'],
        'K2': skills['K2'],
        'K3': skills['K3'],
        'K4': skills['K4'],
        'K5': skills['K5'],
        'K6': skills['K6'],
        'fighter_id': list(fighter_idx.keys())
    }

    dims = {
        'lambda': ['k', 'fighter_id'],
        'gamma':  ['y'],
        'y1':     ['C2', 'K1', 'N'],
        'y2':     ['C2', 'K2', 'N'],
        'n3':     ['C2', 'K3', 'N'],
        'n4':     ['C2', 'K4', 'N'],
        'n5':     ['C2', 'K5', 'N'],
        'n6':     ['C2', 'K6', 'N'],
        'y1_hat': ['C2', 'K1', 'N'],
        'y2_hat': ['C2', 'K2', 'N'],
        'n3_hat': ['C2', 'K3', 'N'],
        'n4_hat': ['C2', 'K4', 'N'],
        'n5_hat': ['C2', 'K5', 'N'],
        'n6_hat': ['C2', 'K6', 'N']
    }

    return coords, dims


def sample(data: Dict, path: str, dims: Dict, coords: Dict,  config: ConfigParser, **kwargs) -> az.InferenceData:
    observed_data        = kwargs.get('observed_data', None)
    posterior_predictive = kwargs.get('posterior_predictive', None)

    n_chains      = config.n_chains
    adapt_delta   = config.adapt_delta
    max_treedepth = config.max_treedepth
    seed          = config.seed

    model = CmdStanModel(stan_file=path)

    fit = model.sample(
        data=data,
        chains=n_chains,
        adapt_delta=adapt_delta,
        max_treedepth=max_treedepth,
        seed=seed
    )

    return az.from_cmdstanpy(
        posterior=fit,
        observed_data=observed_data,
        posterior_predictive=posterior_predictive,
        coords=coords,
        dims=dims
    )