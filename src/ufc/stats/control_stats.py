from crud import _build_records
from stats.stats_type import ControlType
from typing import Dict, List, Mapping, Optional


CONTROL_TYPES_MAPPING: Dict[ControlType, str] = {
    ControlType.CONTROL_BLUE:            'ControlTime',
    ControlType.GROUND_CONTROL_BLUE:     'GroundControlTime',
    ControlType.MISC_CONTROL_BLUE:       'MiscGroundControlTime',
    ControlType.BACK_CONTROL_BLUE:       'BackControlTime',
    ControlType.SIDE_CONTROL_BLUE:       'SideControlTime',
    ControlType.GUARD_CONTROL_BLUE:      'GuardControlTime',
    ControlType.HALF_GUARD_CONTROL_BLUE: 'HalfGuardControlTime',
    ControlType.MOUNT_CONTROL_BLUE:      'MountControlTime'
}


def mmss2sec(mmss: str) -> Optional[int]:
    try:
        minutes, seconds = mmss.split(':')
        return int(minutes) * 60 + int(seconds)

    except AttributeError:
        return None


def get_control_stats(data: Dict) -> Mapping[ControlType, Optional[int]]:
    stats: Dict[ControlType, Optional[int]] = {}

    for control_type, ufc_key in CONTROL_TYPES_MAPPING.items():
        stats[control_type] = mmss2sec(data.get(ufc_key))

    try:
        stats[ControlType.CLINCH_CONTROL_BLUE] = stats[ControlType.CONTROL_BLUE] - stats[ControlType.GROUND_CONTROL_BLUE]
    except TypeError:
        stats[ControlType.CLINCH_CONTROL_BLUE] = None

    return stats


def get_control_stats_records(
        fight_id:        int,
        fighter_id_blue: int,
        fighter_id_red:  int,
        round:           Optional[int],
        data:            List[Dict]
) -> List[Dict]:
    data_blue, data_red = data

    stats_blue = get_control_stats(data=data_blue)
    stats_red  = get_control_stats(data=data_red)

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
