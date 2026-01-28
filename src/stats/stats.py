import pandas as pd
from dataclasses import dataclass
from stats_type import StrikingType, GrapplingType, ControlType
from stats_category import StatsCategory
from helper import Period
from hdi import HDI, hdis
from markov.fight import Fight
from database.domain import get_striking_stats, get_grappling_stats, get_control_stats, get_position_stats
from typing import Any, Dict, List, Optional


@dataclass
class Stat:
    stat_type_id:   int
    fight_id:       int
    period:         Period
    round:          Optional[int]
    hdis:           Dict[float, HDI]

    def to_dict(self) -> Dict:
        return {
            'stat_type_id': self.stat_type_id,
            'fight_id':     self.fight_id,
            'period':       self.period,
            'round':        self.round,
            'hdis': {
                p: hdi.to_dict()
                for p, hdi in self.hdis.items()
            },
        }


def extract_stats_and_hdis(
        fight_id: int,
        fight: Fight,
        probabilities: List[float],
        period: Period,
        round: Optional[int] = None
) -> Dict[str, List[Dict]]:
    """
    Extracts predefined stats from the given fight and computes their highest-density intervals (HDIs)
    """
    stats = [
        (fight.n_strikes_attempted_blue,   StrikingType.STRIKES_ATTEMPTED_BLUE,      StatsCategory.STRIKING),
        (fight.n_strikes_attempted_red,    StrikingType.STRIKES_ATTEMPTED_RED,       StatsCategory.STRIKING),
        (fight.n_strikes_landed_blue,      StrikingType.STRIKES_LANDED_BLUE,         StatsCategory.STRIKING),
        (fight.n_strikes_landed_red,       StrikingType.STRIKES_LANDED_RED,          StatsCategory.STRIKING),
        (fight.n_takedowns_landed_blue,    GrapplingType.TAKEDOWNS_LANDED_BLUE,      StatsCategory.GRAPPLING),
        (fight.n_takedowns_landed_red,     GrapplingType.TAKEDOWNS_LANDED_RED,       StatsCategory.GRAPPLING),
        (fight.n_submission_attempts_blue, GrapplingType.SUBMISSIONS_ATTEMPTED_BLUE, StatsCategory.GRAPPLING),
        (fight.n_submission_attempts_red,  GrapplingType.SUBMISSIONS_ATTEMPTED_RED,  StatsCategory.GRAPPLING),
        (fight.t_ground_control_blue,      ControlType.GROUND_CONTROL_BLUE,          StatsCategory.CONTROL),
        (fight.t_ground_control_red,       ControlType.GROUND_CONTROL_RED,           StatsCategory.CONTROL),
    ]

    striking_stats:  List[Dict] = []
    grappling_stats: List[Dict] = []
    control_stats:   List[Dict] = []

    for sample, stat_type_id, category in stats:
        stat = Stat(
            stat_type_id=stat_type_id.value,
            fight_id=fight_id,
            period=period.value,
            round=round,
            hdis=hdis(sample, probabilities),
        ).to_dict()

        if category == StatsCategory.STRIKING:
            striking_stats.append(stat)

        elif category == StatsCategory.GRAPPLING:
            grappling_stats.append(stat)

        elif category == StatsCategory.CONTROL:
            control_stats.append(stat)

    return {
        'striking':  striking_stats,
        'grappling': grappling_stats,
        'control':   control_stats
    }


def get_stats_records(
        stats: List[str],
        fighter_id: Optional[int],
        opponent_id: Optional[int],
        **kwargs: Any
) -> pd.DataFrame:
    """
    Get striking-, grappling-, control- and position-stats from database
    """
    dfs: List[pd.DataFrame] = []

    for stats_category in StatsCategory:
        df = get_stats_records(
            stats=stats,
            stats_category=stats_category,
            fighter_id=fighter_id,
            opponent_id=opponent_id,
            **kwargs
        )

        if df is None or df.empty:
            continue

        dfs.append(df)

    if not dfs:
        return pd.DataFrame(
            columns=['fight_id', 'round', 'stat', 'value']
        )

    return pd.concat(dfs, axis=0, ignore_index=True)
    