import logging
import sqlite3
import pandas as pd
from database.connection import connect_to_sqlite_db
from database.crud import get_record, record_exists, insert_record, _build_placeholders
from database.factory_type import FactoryType
from typing import Any, Dict, List, Optional, Tuple


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def insert_event_record(event: Dict, db_type: str) -> Optional[int]:
    table = 'events'
    primary_key = 'event_id'

    primary_key_id = insert_record(
        table=table,
        record=event,
        db_type=db_type,
        primary_key=primary_key
    )

    return primary_key_id


def insert_fight_record(fight: Dict, db_type: str) -> Optional[int]:
    table       = 'fights'
    primary_key = 'fight_id'

    primary_key_id = insert_record(
        table=table,
        record=fight,
        db_type=db_type,
        primary_key=primary_key
    )

    return primary_key_id


def insert_fighter_record(fighter: Dict, db_type: str) -> Optional[int]:
    table = 'fighters'
    primary_key = 'fighter_id'

    primary_key_id = insert_record(
        table=table,
        record=fighter,
        db_type=db_type,
        primary_key=primary_key
    )

    return primary_key_id


def insert_judge_record(judge: Dict, db_type: str) -> Optional[int]:
    table       = 'judges'
    primary_key = 'judge_id'

    primary_key_id = insert_record(
        table=table,
        record=judge,
        db_type=db_type,
        primary_key=primary_key
    )

    return primary_key_id


def fighter_record_exists(source: str, fighter_id: int, db_type: str) -> bool:
    table       = 'fighters'
    primary_key = f'{source}_id'

    return record_exists(
        table=table,
        primary_key=primary_key,
        primary_key_id=fighter_id,
        db_type=db_type
    )


def judge_record_exists(source: str, judge_id: int, db_type: str) -> bool:
    table       = 'judges'
    primary_key = f'{source}_id'

    return record_exists(
        table=table,
        primary_key=primary_key,
        primary_key_id=judge_id,
        db_type=db_type
    )


def get_fighter(primary_key: str, fighter_id: int, db_type: str) -> Optional[Dict]:
    table = 'fighters'

    record = get_record(
        table=table,
        primary_key=primary_key,
        primary_key_id=fighter_id,
        db_type=db_type
    )

    return record


def update_image_url_of_fighter(fighter_id: int, url: str) -> None:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            UPDATE fighters
            SET image_url = "{url}"
            WHERE ufc_id = {fighter_id};
        """
        cur.execute(query)
        conn.commit()
        logger.info(f"there are {cur.rowcount} row(s) inserted in table 'fighters'")

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_fighter_ids() -> List[int]:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT ufc_id
            FROM fighters
            WHERE mrkv_id IS NULL;
        """
        fighter_ids = cur.execute(query).fetchall()

        return fighter_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_fighter_ids_by_fight(fight_id: int) -> Tuple[int, int]:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT fighter_id_blue, fighter_id_red
            FROM fights
            WHERE ufc_id = {fight_id};
        """
        fighter_ids = cur.execute(query).fetchone()

        return fighter_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_fight_ids() -> List[int]:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT ufc_id
            FROM fights;
        """
        fight_ids = cur.execute(query).fetchall()

        return fight_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)

def get_event_ids_in_db(year: int) -> List[int]:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT ufc_id AS event_id
            FROM events
            WHERE strftime('%Y', dt) = '{year}';
        """
        event_ids = cur.execute(query).fetchall()

        return event_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)

def get_fight(fight_id: int) -> Dict:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.DICT)

    try:
        query = f"""
            SELECT figther_id_blue,
                   fighter_id_red,
                   n_rounds,
            FROM fights
            WHERE ufc_id = {fight_id};
        """
        n_rounds = cur.execute(query).fetchone()[0]

        return n_rounds

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_n_rounds(fight_id: int) -> int:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
        SELECT n_rounds
        FROM fights
        WHERE ufc_id = {fight_id};
        """
        n_rounds = cur.execute(query).fetchone()[0]

        return n_rounds

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_history(fighter_ids: List[int]) -> pd.DataFrame:
    conn, cur = connect_to_sqlite_db()

    placeholders = _build_placeholders(len(fighter_ids))

    try:
        QUERY = f"""
            SELECT
                event_id,
                ufc_id,
                fighter_id_blue AS fighter_id,
                fighter_id_red  AS opponent_id,
                CASE
                    WHEN winner_id = fighter_id_blue THEN 'BLUE'
                    WHEN winner_id = fighter_id_red  THEN 'RED'
                    ELSE NULL
                END AS winner,
                outcome,
                n_rounds,
                n_seconds
            FROM fights
            WHERE fighter_id_blue IN ({placeholders})

            UNION ALL

            SELECT
                event_id,
                ufc_id,
                fighter_id_red  AS fighter_id,
                fighter_id_blue AS opponent_id,
                CASE
                    WHEN winner_id = fighter_id_blue THEN 'RED'
                    WHEN winner_id = fighter_id_red  THEN 'BLUE'
                    ELSE NULL
                END AS winner,
                outcome,
                n_rounds,
                n_seconds
            FROM fights
            WHERE fighter_id_red IN ({placeholders})
        """

        params = fighter_ids + fighter_ids

        return pd.read_sql_query(sql=QUERY, con=conn, params=params)

    except (Exception, sqlite3.Error) as e:
        logger.error(e)

    finally:
        cur.close()
        conn.close()
