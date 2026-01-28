import numpy as np
from dataclasses import dataclass, asdict
from datetime import datetime
from scripts.database.database import insert_decisions, get_scorecard_ids, get_y
from typing import Any, Dict, List, Literal


@dataclass
class Decision:
    fight_id:    int
    fighter_id:  int
    judge_id:    int
    p:           bytes
    config_id:   int
    ts:          int

    def to_dict(self):
        return asdict(self)


class Decisions():
    def __init__(self, fight_id: int, judge_ids: List[int], config_id: int, n_rounds: int):
        self.fight_id  = fight_id
        self.judge_ids = judge_ids
        self.config_id = config_id
        self.scorecards_blue = get_scorecard_ids(winner="blue", n_rounds=n_rounds)
        self.scorecards_red = get_scorecard_ids(winner="red",  n_rounds=n_rounds)

    def p_decision(self, winner: Literal["blue", "red"], judge_id: int) -> np.ndarray:
        if winner == "blue":
            scorecard_ids = self.scorecards_blue
        else:
            scorecard_ids = self.scorecards_red

        return np.sum([
            get_y(scorecard_id=scorecard_id, fight_id=self.fight_id, judge_id=judge_id, config_id=self.config_id)
            for scorecard_id in scorecard_ids
        ], axis=0)

    @property
    def p_decision_blue(self) -> Dict[int, np.ndarray]:
        return {
            judge_id: self.p_decision(winner="blue", judge_id=judge_id)
            for judge_id in self.judge_ids
        }

    @property
    def p_decision_red(self) -> Dict[int, np.ndarray]:
        return {
            judge_id: self.p_decision(winner="red", judge_id=judge_id)
            for judge_id in self.judge_ids
        }


def save_decisions(decisions: Dict, fight_id: int, fighter_id: int, config_id: int, **kwargs: Any) -> None:
    ts = kwargs.get('ts', int(datetime.now().timestamp()))
    records = []

    for judge_id, p in decisions.items():
        decision = Decision(
            fight_id=fight_id,
            fighter_id=fighter_id,
            judge_id=judge_id,
            p=p.tobytes(),
            config_id=config_id,
            ts=ts
        ).to_dict()
        records.append(decision)

    insert_decisions(decisions=records)