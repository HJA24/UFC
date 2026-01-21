from database.crud import get_mapped_identifier
from typing import List, Optional


def ufc_identifier_to_mrkv_identifier(table: str, ufc_id: int) -> Optional[int]:
    return get_mapped_identifier(
        table=table,
        from_key='ufc_id',
        to_key='mrkv_id',
        from_key_id=ufc_id,
        db_type='sqlite'
    )


def ufc_identifiers_to_mrkv_identifiers(table: str, ufc_ids: List[int]) -> List[Optional[int]]:
    mrkv_identifiers: List[int] = []

    for ufc_id in ufc_ids:
        mrkv_identifier = get_mapped_identifier(
            table=table,
            from_key='ufc_id',
            to_key='mrkv_id',
            from_key_id=ufc_id,
            db_type='sqlite'
        )
        mrkv_identifiers.append(mrkv_identifier)

    return mrkv_identifiers
