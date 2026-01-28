import json
import numpy as np
from datetime import datetime
from dataclasses import dataclass, asdict
from scripts.judging.judge import Judge
from scripts.database.database import insert_y
from typing import Any, Dict


PATH_SCORES = '/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/judging/scores.json'


@dataclass
class Scorecard:
    fight_id:     int
    judge_id:     int
    scorecard_id: int
    p:            bytes
    config_id:    int
    ts:           int

    def to_dict(self):
        return asdict(self)


class Scorecards():
    def __init__(self, judge: Judge, X: np.ndarray, n_rounds: int):
        self.judge = judge
        self.X = X
        self.n_rounds = str(n_rounds)

    @property
    def scores(self) -> Dict:
        return json.load(open(PATH_SCORES))[self.n_rounds]
    
    @property
    def p_round(self) -> Dict:
        return self.judge.p_round(X=self.X)

    def p_scorecard(self, scorecard_id: int) -> np.ndarray:
        combos         = np.asarray(self.scores[str(scorecard_id)])
        scores, inv    = np.unique(combos, return_inverse=True)
        stacked_scores = np.stack([self.p_round[score] for score in scores], axis=0)

        return np.sum(np.prod(stacked_scores[inv], axis=1), axis=0)

    def p_scorecards(self) -> Dict[int, np.ndarray]:
        return {
            scorecard_id: self.p_scorecard(scorecard_id=scorecard_id)
            for scorecard_id in self.scores.keys()
        }


def save_scorecards(scorecards: Dict, fight_id: int, judge_id: int, config_id: int, **kwargs: Any) -> None:
    ts = kwargs.get('ts', int(datetime.now().timestamp()))
    records = []

    for scorecard_id, p in scorecards.items():
        scorecard = Scorecard(
            fight_id=fight_id,
            judge_id=judge_id,
            scorecard_id=scorecard_id,
            p=p.tobytes(),
            config_id=config_id,
            ts=ts
        ).to_dict()
        records.append(scorecard)

    insert_y(y=records)