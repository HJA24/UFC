from crud import _build_records
from stats.stats_type import GrapplingType
from typing import Dict, List, Mapping, Optional


GRAPPLING_TYPES_MAPPING: Dict[GrapplingType, str] = {
    GrapplingType.TAKEDOWNS_ATTEMPTED_BLUE:   'TakedownsAttempted',
    GrapplingType.TAKEDOWNS_LANDED_BLUE:      'TakedownsLanded',
    GrapplingType.REVERSALS_LANDED_BLUE:      'Reversals',
    GrapplingType.SUBMISSIONS_ATTEMPTED_BLUE: 'SubmissionsAttempted',
    GrapplingType.SUBMISSIONS_LANDED_BLUE:    'Submission',
}


def _extract_number_of_standups_landed(data: List[Dict]) -> int:
    data_fighter, data_opponent = data

    n = data_opponent['Knockdowns'] + data_opponent['TakedownsLanded'] + data_opponent['Reversals'] - data_fighter['Reversals']

    if data_opponent['Submission'] == 1 or data_opponent['Knockout']:
        n -= 1

    return max(0, n)


def get_grappling_stats(data: List[Dict]) -> Mapping[GrapplingType, int]:
    data_fighter, _ = data
    
    stats: Dict[GrapplingType, int] = {}

    for grappling_type, ufc_key in GRAPPLING_TYPES_MAPPING.items():
        stats[grappling_type] = data_fighter.get(ufc_key, 0)
    
    stats[GrapplingType.STANDUPS_LANDED_BLUE] = _extract_number_of_standups_landed(data)
    
    return stats


def get_grappling_stats_records(
        fight_id:        int,
        fighter_id_blue: int,
        fighter_id_red:  int,
        round:           Optional[int],
        data:            List[Dict]
) -> List[Dict]:
    stats_blue = get_grappling_stats(data=data)
    stats_red  = get_grappling_stats(data=data[::-1])

    records_blue = _build_records(
        fight_id=fight_id,
        fighter_id=fighter_id_blue,
        opponent_id=fighter_id_red,
        round=round,
        stats=stats_blue
    )

    records_red = _build_records(
        fight_id=fight_id,
        fighter_id=fighter_id_red,
        opponent_id=fighter_id_blue,
        round=round,
        stats=stats_red
    )

    return records_blue + records_red
