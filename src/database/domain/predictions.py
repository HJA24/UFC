import logging
import sqlite3
import psycopg
import numpy as np
from psycopg import sql
from database.connection import connect_to_sqlite_db, connect_to_postgresql_db
from database.crud import insert_record, insert_records
from database.factory_type import FactoryType
from typing import Dict, List, Optional


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def insert_p_records(p: List[Dict], db_type: str) -> None:
    table = 'p'

    insert_records(
        table=table,
        records=p,
        db_type=db_type
    )


def insert_f_record(f: Dict, db_type: str) -> None:
    table = 'f'

    insert_record(
        table=table,
        record=f,
        db_type=db_type
    )


def f_record_exists(fight_id: id, market_id: int, config_id: int) -> bool:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT *
            FROM f
            WHERE fight_id = {fight_id}
                AND market_id = {market_id}
                AND config_id = {config_id};
        """
        cur.execute(query)

        return bool(cur.fetchone())

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_p(fight_id: int, market_id: int, config_id: int) -> np.ndarray:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.NDARRAY)

    try:
        query = f"""
            SELECT p
            FROM p
            WHERE fight_id = {fight_id}
                AND market_id = {market_id}
                AND config_id = {config_id};
        """
        p = cur.execute(query).fetchone()

        return p

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_prediction_type_ids(**kwargs) -> List[int]:
    category = kwargs.get('category', '%')
    tier_id  = kwargs.get('tier', '%')

    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT prediction_type_id
            FROM prediction_types
            WHERE tier_id LIKE '{tier_id}'
                OR category LIKE '{category}'
        """
        prediction_type_ids = cur.execute(query).fetchall()

        return prediction_type_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_prediction_type(prediction_type_id: int) -> Optional[str]:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.DICT)

    try:
        query = f"""
            SELECT *
            FROM prediction_types
            WHERE prediction_type_id = {prediction_type_id}
        """
        prediction_type = cur.execute(query).fetchone()

        return prediction_type

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def insert_predictions_and_hdis(fight_id: int, predictions: List[Dict]) -> None:
    conn, cur = connect_to_postgresql_db()

    try:
        conn.autocommit = False

        parent_table = sql.Identifier('predictions')
        parent_pk    = sql.Identifier('prediction_id')
        type_fk      = sql.Identifier('prediction_type_id')
        child_table  = sql.Identifier('prediction_hdis')
        child_fk     = sql.Identifier('prediction_id')
        hdi_min      = sql.Identifier('min')
        hdi_max      = sql.Identifier('max')

        PREDICTIONS_QUERY = sql.SQL("""
            INSERT INTO {parent_table} (
                {type_fk},
                fight_id,
                stat_type_id
            )
            VALUES (%s, %s, %s)
            RETURNING {parent_pk}
        """).format(
            parent_table=parent_table,
            type_fk=type_fk,
            parent_pk=parent_pk,
        )

        HDIS_QUERY = sql.SQL("""
            INSERT INTO {child_table} (
                {child_fk},
                probability,
                {hdi_min},
                {hdi_max}
            )
            VALUES (%s, %s, %s, %s)
        """).format(
            child_table=child_table,
            child_fk=child_fk,
            hdi_min=hdi_min,
            hdi_max=hdi_max
        )

        for prediction in predictions:
            hdis = prediction.pop('hdis')

            cur.execute(
                PREDICTIONS_QUERY,
                (
                    prediction['prediction_type_id'].value,
                    fight_id,
                    prediction['stat_type_id']
                )
            )
            parent_id = cur.fetchone()[0]

            rows = [
                (
                    parent_id,
                    probability,
                    hdi['min'],
                    hdi['max']
                ) for probability, hdi in hdis.items()
            ]

            cur.executemany(HDIS_QUERY, rows)

        conn.commit()
        logger.info(f"fight: {fight_id} - successfully inserted predictions")

    except (Exception, psycopg.Error) as e:
        conn.rollback()
        logger.error(f"fight: {fight_id} - something went wrong while inserting predictions: {e}")

    finally:
        conn.close()
