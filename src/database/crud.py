import logging
import sqlite3
from psycopg import sql
from database.connection import connect_to_sqlite_db, connect_to_postgresql_db
from database.database_type import DatabaseType
from database.factory_type import FactoryType
from typing import Any, Dict, List, Mapping, Optional


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def _build_placeholders(n: int) -> str:
    return ",".join(["?"] * n)


def _build_get_query_sqlite(table: str, primary_key: str) -> str:
    return f"SELECT * FROM {table} WHERE {primary_key} = :primary_key_id"


def _build_get_query_postgres(table: str, primary_key: str) -> sql.Composed:
    return sql.SQL("SELECT * FROM {} WHERE {} = %(primary_key_id)s").format(
        sql.Identifier(table),
        sql.Identifier(primary_key),
    )


def _build_insert_query_sqlite(table: str, record: Mapping[str, Any]) -> str:
    fields = ", ".join(k for k in record.keys())
    vals   = ", ".join(f":{k}" for k in record.keys())

    return f"INSERT INTO {table} ({fields}) VALUES ({vals})"


def _build_insert_query_postgres(table: str, record: Mapping[str, Any], primary_key: Optional[str] = None) -> sql.Composed:
    if primary_key is None:
        return sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
            sql.Identifier(table),
            sql.SQL(", ").join(map(sql.Identifier, record.keys())),
            sql.SQL(", ").join(sql.Placeholder(k) for k in record.keys())
        )
    else:
        return sql.SQL("INSERT INTO {} ({}) VALUES ({}) RETURNING {}").format(
            sql.Identifier(table),
            sql.SQL(", ").join(map(sql.Identifier, record.keys())),
            sql.SQL(", ").join(sql.Placeholder(k) for k in record.keys()),
            sql.Identifier(primary_key)
        )


def insert_record(
        table: str,
        record: Mapping[str, Any],
        db_type: str,
        primary_key: Optional[str] = None
) -> Optional[int]:
    pk = None

    if db_type == DatabaseType.POSTGRESQL.value:
        conn, cur = connect_to_postgresql_db()
        QUERY = _build_insert_query_postgres(
            table=table,
            record=record,
            primary_key=primary_key
        )
    elif db_type == DatabaseType.SQLITE.value:
        conn, cur = connect_to_sqlite_db()
        QUERY = _build_insert_query_sqlite(table, record)

    else:
        raise ValueError(f"Unsupported database type: {db_type}")

    try:
        cur.execute(QUERY, record)

        if db_type == DatabaseType.POSTGRESQL.value:
            pk = cur.fetchone()[0]

        conn.commit()
        logger.info(f"{cur.rowcount} row(s) inserted into {table}")

        return pk

    except Exception as e:
        logger.error(f'something went wrong while inserting records to {table}: {e}')
        conn.rollback()

    finally:
        cur.close()
        conn.close()


def insert_records(
        table: str,
        records: List[Mapping[str, Any]],
        db_type: str
) -> None:
    if db_type == DatabaseType.POSTGRESQL.value:
        conn, cur = connect_to_postgresql_db()
        QUERY = _build_insert_query_postgres(table, records[0])

    elif db_type == DatabaseType.SQLITE.value:
        conn, cur = connect_to_sqlite_db()
        QUERY = _build_insert_query_sqlite(table, records[0])

    else:
        raise ValueError(f"Unsupported database type: {db_type}")

    try:
        cur.executemany(QUERY, records)
        conn.commit()
        logger.info(f"{cur.rowcount} row(s) inserted into {table}")

    except Exception as e:
        logger.error(e)
        conn.rollback()

    finally:
        cur.close()
        conn.close()


def get_record(table: str, primary_key: str, primary_key_id: int, db_type: str) -> Optional[Dict]:
    if db_type == DatabaseType.SQLITE.value:
        conn, cur = connect_to_sqlite_db(factory_type=FactoryType.DICT)
        QUERY = _build_get_query_sqlite(
            table=table,
            primary_key=primary_key
        )

    elif db_type == DatabaseType.POSTGRESQL.value:
        conn, cur = connect_to_postgresql_db(factory_type=FactoryType.DICT)
        QUERY = _build_get_query_postgres(
            table=table,
            primary_key=primary_key
        )

    else:
        raise ValueError(f"Unsupported database type: {db_type}")

    try:
        cur.execute(QUERY, {'primary_key_id': primary_key_id})

        return cur.fetchone()

    except Exception as e:
        logger.error(e)
        conn.rollback()

    finally:
        cur.close()
        conn.close()


def record_exists(table: str, primary_key: str, primary_key_id: int, db_type: str) -> bool:
    return bool(
        get_record(
            table=table,
            primary_key=primary_key,
            primary_key_id=primary_key_id,
            db_type=db_type
         )
    )


def get_mapped_identifier(
        table: str,
        from_key: str,
        to_key: str,
        from_key_id: int,
        db_type: str
) -> Optional[int]:

    if db_type == DatabaseType.SQLITE.value:
        conn, cur = connect_to_sqlite_db()
        QUERY = f"SELECT {to_key} FROM {table} WHERE {from_key} = :from_key_id"

    elif db_type == DatabaseType.POSTGRESQL.value:
        conn, cur = connect_to_postgresql_db()
        QUERY = f"SELECT {to_key} FROM {table} WHERE {from_key} = %(from_key_id)s"

    else:
        raise ValueError(f"Unsupported database type: {db_type}")

    try:
        cur.execute(QUERY, {'from_key_id': from_key_id})
        row = cur.fetchone()

        return None if row is None else row[0]

    except Exception as e:
        logger.error(e)

    finally:
        cur.close()
        conn.close()


def update_table_with_mrkv_identifier(table: str, mrkv_id: int, ufc_id: int) -> None:
    conn, cur = connect_to_sqlite_db()

    try:
        query = f"""
            UPDATE {table}
            SET mrkv_id = {mrkv_id}
            WHERE ufc_id = {ufc_id};
        """
        cur.execute(query)
        conn.commit()
        logger.info(f"there are {cur.rowcount} row(s) inserted in table '{table}'")

    except (Exception, sqlite3.Error) as e:
        logger.error(e)