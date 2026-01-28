import numpy as np
from scripts.judging.ordinal import pmf
from scripts.database.database import get_beta, get_cutpoint, get_n_judged_fights
from typing import Any, Dict, List


def assign_random_judges(n_judges: int, **kwargs: Any) -> List[int]:
    year = kwargs.get('year', 2024)

    n_judged_fights = get_n_judged_fights(year=year)
    judge_ids = n_judged_fights['judge_id'].tolist()
    p = n_judged_fights['n'].div(n_judged_fights['n'].sum())

    judge_ids = np.random.choice(
        a=judge_ids,
        size=n_judges,
        replace=False,
        p=p).tolist()

    return judge_ids


class Judge():
    def __init__(self, judge_id: int, model: Dict):
        self.model = model
        self.judge_id = judge_id
        self.model_id = model['model_id']
        self.K = model['K']
        self.y = list(model['y'].values())
        self.Y = len(self.y)

    @property
    def beta(self) -> np.ndarray:
        return np.vstack([
            get_beta(
                k=k,
                judge_id=self.judge_id,
                model_id=self.model_id
            ) for k in self.K
        ]).T

    @property
    def c(self) -> np.ndarray:
        return np.vstack([
            get_cutpoint(
                c=i,
                model_id=self.model_id
            ) for i in range(1, self.Y)
        ]).T

    def p_round(self, X: np.ndarray) -> Dict:
        eta = np.sum(X.T * self.beta, axis=1)
        p   = pmf(eta=eta, c=self.c)

        return dict(zip(self.y, p.T))