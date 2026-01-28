import sqlite3
import psycopg
from psycopg import sql, rows
from configparser import ConfigParser
from database.factory_type import *
from database.factories import list_factory, dict_factory, ndarray_factory
from typing import Callable, Dict, Optional, Tuple


PATH_DB =     '/Users/huibmeulenbelt/PycharmProjects/ufc/data/db/octagon.db'
PATH_CONFIG = '/database/config/digital_ocean.ini'


RowFactory = Callable[[sqlite3.Cursor, sqlite3.Row], object]

_FACTORY_MAP: Dict["FactoryType", RowFactory] = {
    FactoryType.LIST: list_factory,
    FactoryType.DICT: dict_factory,
    FactoryType.NDARRAY: ndarray_factory,
}


def _get_row_factory(factory_type: Optional["FactoryType"]) -> Optional[RowFactory]:
    if factory_type is None:
        return None
    try:
        return _FACTORY_MAP[factory_type]
    except KeyError as e:
        raise ValueError(f'Unsupported FactoryType: {factory_type}') from e


def connect_to_sqlite_db(
        factory_type: Optional[FactoryType] = None
) -> Tuple[sqlite3.Connection, sqlite3.Cursor]:
    conn = sqlite3.connect(
        database=PATH_DB,
        detect_types=sqlite3.PARSE_DECLTYPES
    )
    cur = conn.cursor()

    row_factory = _get_row_factory(factory_type=factory_type)

    if row_factory is not None:
        cur.row_factory = row_factory

    return conn, cur


def _get_config() -> Dict[str, str]:
    parser = ConfigParser()
    parser.read(PATH_CONFIG)

    if not parser.has_section('postgresql'):
        raise RuntimeError("Section 'postgresql' not found in config file")

    return dict(parser.items('postgresql'))


def connect_to_postgresql_db(
        factory_type: Optional[FactoryType] = None
) -> psycopg.connection:
    config = _get_config()
    conn = psycopg.connect(**config)

    if factory_type is FactoryType.DICT:
        cur = conn.cursor(row_factory=rows.dict_row)
    else:
        cur = conn.cursor()

    return conn, cur

