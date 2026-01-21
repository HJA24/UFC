import logging
import sqlite3
from database.connection import connect_to_sqlite_db
from database.crud import insert_record
from database.factory_type import FactoryType
from typing import Dict, List


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def insert_config_record(config: Dict, db_type: str) -> None:
    table = 'configurations'

    insert_record(
        table=table,
        record=config,
        db_type=db_type
    )


def config_record_exists(config_id: int) -> bool:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT *
            FROM configurations
            WHERE config_id = {config_id};
        """
        cur.execute(query)

        return bool(cur.fetchone())

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_config_id(fighting_id: int, judging_id: int) -> int:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT config_id
            FROM configurations
            WHERE fighting_id = {fighting_id}
                AND judging_id = {judging_id};
        """
        config_id = cur.execute(query).fetchone()[0]

        return config_id

    except (Exception, sqlite3.Error) as e:
        logger.error(e)

