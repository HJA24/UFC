import logging
import sqlite3
import numpy as np
import pandas as pd
from database.connection import connect_to_sqlite_db
from database.crud import insert_record, insert_records
from database.factory_type import FactoryType
from typing import Any, Dict, List, Optional


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def insert_score_record(score: Dict, db_type: str) -> None:
    table = 'scores'

    insert_record(
        table=table,
        record=score,
        db_type=db_type
    )


def insert_scorecard_records(scorecards: List[Dict], db_type: str) -> None:
    table = 'scorecards'

    insert_records(
        table=table,
        records=scorecards,
        db_type=db_type
    )


def insert_decision_records(decisions: List[Dict], db_type: str) -> None:
    table = 'decisions'

    insert_records(
        table=table,
        records=decisions,
        db_type=db_type
    )


def insert_y_records(y: List[Dict], db_type: str) -> None:
    table = 'y'

    insert_records(
        table=table,
        records=y,
        db_type=db_type
    )


def insert_beta_record(beta: Dict, db_type: str) -> None:
    table = 'betas'

    beta_bytes = beta['posterior'].tobytes()
    beta['posterior'] = beta_bytes

    insert_record(
        table=table,
        record=beta,
        db_type=db_type
    )


def insert_cutpoint_record(cut_point:  Dict, db_type: str) -> None:
    table = 'cutpoints'

    cut_point_bytes = cut_point['posterior'].tobytes()
    cut_point['posterior'] = cut_point_bytes

    insert_record(
        table=table,
        record=cut_point,
        db_type=db_type
    )


def scorecard_record_exists(fight_id: int, judge_id: int) -> bool:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT *
            FROM scorecards
            WHERE fight_id = {fight_id}
                AND judge_id = {judge_id};
        """
        cur.execute(query)

        return bool(cur.fetchone())

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_beta(k: str, judge_id: int, model_id: int) -> np.ndarray:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.NDARRAY)

    try:
        query = f"""
            SELECT posterior
            FROM betas
            WHERE k = '{k}'
                AND judge_id = {judge_id}
                AND model_id = {model_id}
                AND ts = (SELECT MAX(ts) FROM betas WHERE judge_id=judge_id AND model_id=model_id);
        """
        beta = cur.execute(query).fetchone()

        return beta

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_cutpoint(c: int, model_id: int) -> np.ndarray:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.NDARRAY)

    try:
        query = f"""
            SELECT posterior
            FROM cut_points
            WHERE c = {c}
                AND model_id = {model_id}
                AND ts = (SELECT MAX(ts) FROM cut_points WHERE model_id=model_id);
        """
        cutpoint = cur.execute(query).fetchone()

        return cutpoint

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_y(scorecard_id: int, fight_id: int, judge_id: int, config_id: int) -> np.ndarray:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.NDARRAY)

    try:
        query = f"""
            SELECT p
            FROM y
            WHERE scorecard_id = {scorecard_id}
                AND fight_id = {fight_id}
                AND judge_id = {judge_id}
                AND config_id = {config_id};
        """
        y = cur.execute(query).fetchone()

        return y

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_judge_id(name: str) -> int:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT judge_id
            FROM judges
            WHERE name = "{name}";
        """
        judge_id = cur.execute(query).fetchone()[0]

        return judge_id

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_judge_name(judge_id: int) -> str:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT name
            FROM judges
            WHERE ufc_id = {judge_id};
        """
        judge_name = cur.execute(query).fetchone()[0]

        return judge_name

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_judge_ids() -> List[int]:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT ufc_id
            FROM judges;
        """
        judge_ids = cur.execute(query).fetchall()

        return judge_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_scorecard_ids(n_rounds: int, **kwargs: Any) -> List[int]:
    winner = kwargs.get('winner', '%')

    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT scorecard_id
            FROM scores
            WHERE winner LIKE '{winner}'
                AND n_rounds = {n_rounds};
        """
        scorecard_ids = cur.execute(query).fetchall()

        return scorecard_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_scorecards(judge_id: int, **kwargs: Any) -> pd.DataFrame:
    fight_id = kwargs.get('fight_id', '%')
    fighter_id = kwargs.get('fighter_id', '%')
    round = kwargs.get('round', '%')

    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT fight_id, fighter_id, round, n_points
            FROM scorecards
            WHERE judge_id = {judge_id}
                AND fight_id LIKE '{fight_id}'
                AND fighter_id LIKE '{fighter_id}'
            AND round LIKE '{round}'
        """
        df = pd.read_sql(sql=query, con=conn)

        return df

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_n_judged_fights(year: int=2024) -> pd.DataFrame:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            WITH is_judge AS (
                SELECT s.judge_id, s.fight_id, 1 AS n
                FROM scorecards s
                INNER JOIN fights f
                ON f.ufc_id = s.fight_id
                WHERE f.dt > {year}
                GROUP BY s.judge_id, s.fight_id
            )

            SELECT judge_id, COUNT(*) AS n
            FROM is_judge
            WHERE judge_id IN (SELECT DISTINCT judge_id FROM betas)
            GROUP BY judge_id
            ORDER BY n DESC;
        """

        df = pd.read_sql(sql=query, con=conn)

        return df

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_fight_ids_without_scorecards_in_db() -> List[int]:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT ufc_id
            FROM fights f
            WHERE NOT EXISTS (SELECT 1 FROM scorecards s WHERE s.fight_id = f.ufc_id)
        """
        event_ids = cur.execute(query).fetchall()

        return event_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)
