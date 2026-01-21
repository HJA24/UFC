import logging
import sqlite3
import numpy as np
from database.connection import connect_to_sqlite_db
from database.crud import insert_records
from database.factory_type import FactoryType
from typing import Any, Dict, List, Optional, Tuple


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def insert_edge_records(edges: List[Dict], db_type: str) -> None:
    table = 'edges'

    insert_records(
        table=table,
        records=edges,
        db_type=db_type
    )


def edges_records_exists(fight_id: int, model_id: int) -> bool:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT *
            FROM edges
            WHERE fight_id = {fight_id}
                AND model_id = {model_id};
        """
        cur.execute(query)

        return bool(cur.fetchone())

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_edge_ids(graph_id: int) -> List:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT edge_id
            FROM graphs
            WHERE graph_id = {graph_id};
        """
        edge_ids = cur.execute(query).fetchall()

        return edge_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_u_and_v(edge_id: int) -> Tuple:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT u, v
            FROM graphs
            WHERE edge_id = {edge_id};
        """
        u, v = cur.execute(query).fetchone()

        return u, v

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_weight(fight_id: int, edge_id, model_id: int) -> np.ndarray:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.NDARRAY)

    try:
        query = f"""
            SELECT weight
            FROM edges
            WHERE fight_id = {fight_id}
                AND edge_id = {edge_id}
                AND model_id = {model_id};
        """
        weight = cur.execute(query).fetchone()

        return weight

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_markov_id(abbreviation: str, **kwargs) -> int:
    fighter = kwargs.get('fighter', '%')

    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT markov_id
            FROM markov
            WHERE abbreviation = '{abbreviation}'
                AND fighter LIKE '{fighter}';
        """
        markov_id = cur.execute(query).fetchone()[0]

        return markov_id

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_body_part(markov_id: int) -> Optional[str]:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT body_part
            FROM markov
            WHERE markov_id = {markov_id};
        """
        body_part = cur.execute(query).fetchone()

        return body_part

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_submission_technique(markov_id: int) -> Optional[str]:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT choke
            FROM markov
            WHERE markov_id = {markov_id};
        """
        choke = cur.execute(query).fetchone()

        return choke

    except (Exception, sqlite3.Error) as e:
        logger.error(e)
