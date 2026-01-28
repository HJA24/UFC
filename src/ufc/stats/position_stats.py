from crud import _build_records
from stats.stats_type import PositionType
from typing import Dict, List, Mapping, Optional


POSITION_TYPES_MAPPING: Dict[PositionType, str] = {
    PositionType.STANDING: 'StandingTime',
    PositionType.DISTANCE: 'DistanceTime',
    PositionType.CLINCH:   'ClinchTime',
    PositionType.GROUND:   'GroundTime',
    PositionType.NEUTRAL:  'NeutralTime'
}


def mmss2sec(mmss: str) -> Optional[int]:
    try:
        minutes, seconds = mmss.split(':')
        return int(minutes) * 60 + int(seconds)

    except AttributeError:
        return None


def _extract_neutral_ground_time(data: List[Dict]) -> Optional[int]:
    data_blue, data_red = data

    try:
        t = mmss2sec(data_blue['GroundTime']) - mmss2sec(data_blue['GroundControlTime']) - mmss2sec(data_red['GroundControlTime'])
    except TypeError:
        t = None

    return t


def _extract_neutral_clinch_time(data: List[Dict]) -> Optional[int]:
    data_blue, data_red = data

    try:
        CC_blue = mmss2sec(data_blue['ControlTime']) - mmss2sec(data_blue['GroundControlTime'])
        CC_red =  mmss2sec(data_red['ControlTime'])  - mmss2sec(data_red['GroundControlTime'])
        CT     = mmss2sec(data_blue['ClinchTime'])

        t = CT - CC_blue - CC_red

    except TypeError:
        t = None

    return t


def get_position_stats(data: List[Dict]) -> Mapping[PositionType, Optional[int]]:
    data_blue, data_red = data

    stats: Dict[PositionType, Optional[int]] = {}

    for position_type, ufc_key in POSITION_TYPES_MAPPING.items():
        stats[position_type] = mmss2sec(data_blue.get(ufc_key))

    stats[PositionType.NEUTRAL_GROUND]   = _extract_neutral_ground_time(data=data)
    stats[PositionType.NEUTRAL_CLINCH]   = _extract_neutral_clinch_time(data=data)

    try:
        stats[PositionType.NEUTRAL_STANDING] = stats[PositionType.NEUTRAL]  - stats[PositionType.NEUTRAL_GROUND]
        stats[PositionType.NEUTRAL_DISTANCE] = stats[PositionType.STANDING] - stats[PositionType.NEUTRAL_CLINCH]

    except TypeError:
        stats[PositionType.NEUTRAL_STANDING] = None
        stats[PositionType.NEUTRAL_DISTANCE] = None

    return stats


def get_position_stats_records(
        fight_id:        int,
        round:           Optional[int],
        data:            List[Dict]
) -> List[Dict]:
    stats = get_position_stats(data=data)

    records = _build_records(
        fight_id=fight_id,
        round=round,
        stats=stats
    )

    return records