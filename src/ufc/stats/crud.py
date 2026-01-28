from stats.stats_type import StatsType
from typing import Any, Dict, List, Mapping, Optional


def _build_record(
        fight_id:    int,
        round:       Optional[int],
        stat:        str,
        value:       Optional[int],
        **kwargs:    Any
) -> Dict:
    fighter_id  = kwargs.get('fighter_id')
    opponent_id = kwargs.get('opponent_id')

    record = {
        'fight_id':    fight_id,
        'round':       round,
        'stat':        stat,
        'value':       value
    }

    if fighter_id is not None:
        record['fighter_id']  = fighter_id
        record['opponent_id'] = opponent_id

    return record


def _build_records(
        fight_id:    int,
        round:       Optional[int],
        stats:       Mapping[StatsType, Optional[int]],
        **kwargs:    Any
) -> List[Dict]:
    records: List[Dict] = []

    for stats_type, value in stats.items():
        record = _build_record(
            fight_id=fight_id,
            round=round,
            stat=stats_type.abbr,
            value=value,
            **kwargs
        )
        records.append(record)

    return records
