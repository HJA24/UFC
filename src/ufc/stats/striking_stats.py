from crud import _build_records
from stats.stats_type import StrikingType
from stats.stats_view import StatsView
from stats.stats_hierarchy import STRIKING_HIERARCHY
from typing import Dict, List, Mapping, Optional


STRIKING_TYPES_MAPPING: Dict[StrikingType, str] = {
    StrikingType.KNOCKOUTS_LANDED_BLUE:                        'Knockout',
    StrikingType.KNOCKDOWNS_LANDED_BLUE:                       'Knockdowns',

    StrikingType.STRIKES_FROM_DISTANCE_AT_HEAD_ATTEMPTED_BLUE: 'SigDistanceHeadStrikesAttempted',
    StrikingType.STRIKES_FROM_DISTANCE_AT_BODY_ATTEMPTED_BLUE: 'SigDistanceBodyStrikesAttempted',
    StrikingType.STRIKES_FROM_DISTANCE_AT_LEGS_ATTEMPTED_BLUE: 'SigDistanceLegStrikesAttempted',

    StrikingType.STRIKES_FROM_CLINCH_AT_HEAD_ATTEMPTED_BLUE:   'SigClinchHeadStrikesAttempted',
    StrikingType.STRIKES_FROM_CLINCH_AT_BODY_ATTEMPTED_BLUE:   'SigClinchBodyStrikesAttempted',
    StrikingType.STRIKES_FROM_CLINCH_AT_LEGS_ATTEMPTED_BLUE:   'SigClinchLegStrikesAttempted',

    StrikingType.STRIKES_FROM_GROUND_AT_HEAD_ATTEMPTED_BLUE:   'SigGroundHeadStrikesAttempted',
    StrikingType.STRIKES_FROM_GROUND_AT_BODY_ATTEMPTED_BLUE:   'SigGroundBodyStrikesAttempted',
    StrikingType.STRIKES_FROM_GROUND_AT_LEGS_ATTEMPTED_BLUE:   'SigGroundLegStrikesAttempted',

    StrikingType.STRIKES_FROM_DISTANCE_AT_HEAD_LANDED_BLUE:    'SigDistanceHeadStrikesLanded',
    StrikingType.STRIKES_FROM_DISTANCE_AT_BODY_LANDED_BLUE:    'SigDistanceBodyStrikesLanded',
    StrikingType.STRIKES_FROM_DISTANCE_AT_LEGS_LANDED_BLUE:    'SigDistanceLegStrikesLanded',

    StrikingType.STRIKES_FROM_CLINCH_AT_HEAD_LANDED_BLUE:      'SigClinchHeadStrikesLanded',
    StrikingType.STRIKES_FROM_CLINCH_AT_BODY_LANDED_BLUE:      'SigClinchBodyStrikesLanded',
    StrikingType.STRIKES_FROM_CLINCH_AT_LEGS_LANDED_BLUE:      'SigClinchLegStrikesLanded',
    StrikingType.STRIKES_FROM_GROUND_AT_HEAD_LANDED_BLUE:      'SigGroundHeadStrikesLanded',
    StrikingType.STRIKES_FROM_GROUND_AT_BODY_LANDED_BLUE:      'SigGroundBodyStrikesLanded',
    StrikingType.STRIKES_FROM_GROUND_AT_LEGS_LANDED_BLUE:      'SigGroundLegStrikesLanded',
}


def get_striking_stats(data: Dict) -> Mapping[StrikingType, int]:
    stats: Dict[StrikingType, int] = {}

    stats_view = StatsView(StrikingType, STRIKING_HIERARCHY)

    for striking_type, ufc_key in STRIKING_TYPES_MAPPING.items():
        stats[striking_type] = data.get(ufc_key)

    mapped_striking_types = set(STRIKING_TYPES_MAPPING.keys())
    other_striking_types  = [striking_type for striking_type in StrikingType if striking_type not in mapped_striking_types]

    for striking_type in other_striking_types:
        children = stats_view.children_of(striking_type).all()
        stats[striking_type] = sum(stats[child] for child in children)

    return stats


def get_striking_stats_records(
        fight_id:        int,
        fighter_id_blue: int,
        fighter_id_red:  int,
        round:           Optional[int],
        data:            List[Dict]
) -> List[Dict]:
    stats_blue = get_striking_stats(data=data[0])
    stats_red  = get_striking_stats(data=data[1])

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

