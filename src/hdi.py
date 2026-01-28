from dataclasses import dataclass, asdict
import numpy as np
import arviz as az
from typing import Dict, List


@dataclass(frozen=True)
class HDI:
    min: float
    max: float

    def to_dict(self):
        return asdict(self)


def hdi(x: np.ndarray, p: float) -> HDI:
    if p > 1 or p < 0:
        raise ValueError(f'p should be between 0 and 1')

    arr = az.hdi(ary=x, hdi_prob=p, skipna=True)

    if len(arr) != 2:
        raise ValueError(f"Expected HDI array of length 2, got {len(arr)}")

    return HDI(min=float(arr[0]), max=float(arr[1]))


def hdis(x: np.ndarray, ps: List[float]) -> Dict[float, HDI]:
    return dict(
        (p, hdi(x=x, p=p)) for p in ps
    )