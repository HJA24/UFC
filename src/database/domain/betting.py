import logging
import sqlite3
from database.connection import connect_to_sqlite_db
from database.factory_type import FactoryType
from typing import Any, List, Literal, Optional


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def get_odds(fight_id: int, fighter_id: int, **kwargs: Any) -> Optional[float]:
    bookie = kwargs.get('bookie', '%')
    market = kwargs.get('market', '%')

    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            SELECT odds
            FROM odds
            WHERE fight_id = {fight_id}
                AND fighter_id = {fighter_id}
                AND bookie LIKE '{bookie}'
                AND market LIKE '{market}'
            ORDER BY ts DESC;
        """
        odds = cur.execute(query).fetchone()[0]

        return odds

    except (Exception, sqlite3.Error) as e:
        logger.error(f'{fight_id} - no odds available: {e}')


def get_operations(market_id: int, operation: Literal['XOR', 'NAND', 'IMPLIES']) -> List[int]:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT q
            FROM operations
            WHERE p = {market_id}
                AND operation = '{operation}';
        """
        operations = cur.execute(query).fetchall()

        return operations

    except (Exception, sqlite3.Error) as e:
        logger.error(e)
