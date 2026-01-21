import logging
import sqlite3
import psycopg
import pandas as pd
from psycopg import sql
from database.connection import connect_to_sqlite_db, connect_to_postgresql_db
from database.crud import insert_records, _build_placeholders
from database.factory_type import FactoryType
from stats.stats_category import StatsCategory
from typing import Any, Dict, List, Optional, Sequence


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def insert_stats_records(
        stats: List[Dict],
        stats_category: StatsCategory,
        db_type: str
) -> None:

    table_by_category = {
        StatsCategory.STRIKING:  'striking_stats',
        StatsCategory.GRAPPLING: 'grappling_stats',
        StatsCategory.CONTROL:   'control_stats',
        StatsCategory.POSITION:  'position_stats',
    }

    try:
        table = table_by_category[stats_category]
    except KeyError:
        raise ValueError(f'Unsupported stats-category: {stats_category}')

    insert_records(
        table=table,
        records=stats,
        db_type=db_type
    )


def insert_stats(fight_id: int, category: str, stats: List[Dict]) -> None:
    conn, cur = connect_to_postgresql_db()

    try:
        conn.autocommit = False

        parent_table = sql.Identifier(f'{category}_stats')
        parent_pk    = sql.Identifier(f'{category}_stats_id')
        type_fk      = sql.Identifier(f'{category}_stats_type_id')
        child_table  = sql.Identifier(f'{category}_stats_hdis')
        child_fk     = sql.Identifier(f'{category}_stats_id')
        hdi_min      = sql.Identifier('min')
        hdi_max      = sql.Identifier('max')

        STATS_QUERY = sql.SQL("""
            INSERT INTO {parent_table} (
                {type_fk},
                fight_id,
                period,
                round
            )
            VALUES (%s, %s, %s, %s)
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

        for stat in stats:
            hdis = stat.pop('hdis')

            cur.execute(
                STATS_QUERY,
                (
                    stat['stat_type_id'].value,
                    fight_id,
                    stat['period'],
                    stat['round']
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
        logger.info(f"fight: {fight_id} - successfully inserted {category}-stats")

    except (Exception, psycopg.Error) as e:
        conn.rollback()
        logger.error(f"fight: {fight_id} - something went wrong while inserting {category}-stats: {e}")

    finally:
        conn.close()


def get_stats_records(
        stats: List[str],
        stats_category: StatsCategory,
        fighter_id: Optional[int],
        opponent_id: Optional[int],
        **kwargs: Any
) -> Optional[pd.DataFrame]:

    fight_ids:      Sequence[int] = kwargs.get('fight_ids', []) or []
    excl_fight_ids: Sequence[int] = kwargs.get('excl_fight_ids', []) or []

    table_by_category = {
        StatsCategory.STRIKING:  'striking_stats',
        StatsCategory.GRAPPLING: 'grappling_stats',
        StatsCategory.CONTROL:   'control_stats',
        StatsCategory.POSITION:  'position_stats',
    }

    try:
        table = table_by_category[stats_category]
    except KeyError:
        raise ValueError(f'Unsupported stats-category: {stats_category}')

    if not stats:
        cols = ['fight_id', 'fighter_id', 'opponent_id', 'round', 'stat', 'value']
        return pd.DataFrame(columns=cols)

    conn, cur = connect_to_sqlite_db()

    try:
        select_cols = ['fight_id', 'round', 'stat', 'value']
        where_parts = [f'stat IN ({_build_placeholders(len(stats))})']
        params: List[Any] = list(stats)

        if fight_ids:
            select_cols = ['fight_id', 'fighter_id', 'round', 'stat', 'value']
            where_parts.append(f'fight_id IN ({_build_placeholders(len(fight_ids))})')
            params.extend(fight_ids)

        else:
            if fighter_id is None or opponent_id is None:
                raise ValueError('fighter_id and opponent_id are required when fight_ids is not provided')

            where_parts.append('fighter_id = ?')
            where_parts.append('opponent_id = ?')
            params.extend([fighter_id, opponent_id])

            if excl_fight_ids:
                where_parts.append(f'fight_id NOT IN ({_build_placeholders(len(excl_fight_ids))})')
                params.extend(excl_fight_ids)

        QUERY = f'''
            SELECT {', '.join(select_cols)}
            FROM {table}
            WHERE {' AND '.join(where_parts)}
        '''

        return pd.read_sql_query(QUERY, conn, params=params)

    except (Exception, sqlite3.Error) as e:
        logger.error(e)

    finally:
        cur.close()
        conn.close()


def get_striking_stats(
        stats: List[str],
        fighter_id: Optional[int],
        opponent_id: Optional[int],
        **kwargs: Any
) -> Optional[pd.DataFrame]:

    fight_ids = kwargs.get('fight_ids', [])
    excl_fight_ids = kwargs.get('excl_fight_ids', [])

    conn, cur = connect_to_sqlite_db()

    try:
        if len(fight_ids) == 0:
            query = f"""
                SELECT fight_id,
                       round,
                       stat,
                       value
                FROM striking_stats
                WHERE stat in {tuple(stats)}
                    AND fighter_id = {fighter_id}
                    AND opponent_id = {opponent_id}
                    AND fight_id NOT IN {tuple(excl_fight_ids)};
            """

        else:
            query = f"""
                SELECT fight_id,
                       fighter_id,
                       round,
                       stat,
                       value
                FROM striking_stats
                WHERE stat in {tuple(stats)}
                    AND fight_id IN {tuple(fight_ids)};
            """

        df = pd.read_sql(sql=query, con=conn)

        return df

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_grappling_stats(
        stats:       List[str],
        fighter_id:  Optional[int],
        opponent_id: Optional[int],
        **kwargs: Any
) -> Optional[pd.DataFrame]:

    fight_ids      = kwargs.get('fight_ids', [])
    excl_fight_ids = kwargs.get('excl_fight_ids', [])

    conn, cur = connect_to_sqlite_db()

    try:
        if len(fight_ids) == 0:
            query = f"""
                SELECT fight_id,
                       round,
                       stat,
                       n
                FROM grappling_stata
                WHERE stat in {tuple(stats)}
                    AND fighter_id = {fighter_id}
                    AND opponent_id = {opponent_id}
                    AND fight_id NOT IN {tuple(excl_fight_ids)};
            """

        else:
            query = f"""
                SELECT fight_id,
                       fighter_id,
                       round,
                       stat,
                       n
                FROM grappling_stats
                WHERE stat in {tuple(stats)}
                    AND fight_id IN {tuple(fight_ids)};
            """

        df = pd.read_sql(sql=query, con=conn)

        return df

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_control_stats(
        stats:       List[str],
        fighter_id:  Optional[int],
        opponent_id: Optional[int],
        **kwargs: Any
) -> Optional[pd.DataFrame]:

    fight_ids      = kwargs.get('fight_ids', [])
    excl_fight_ids = kwargs.get('excl_fight_ids', [])

    conn, cur = connect_to_sqlite_db()

    try:
        if len(fight_ids) == 0:
            query = f"""
                SELECT fight_id,
                       round,
                       stat,
                       value
                FROM control_stats
                WHERE stat in {tuple(stats)}
                    AND fighter_id = {fighter_id}
                    AND opponent_id = {opponent_id}
                    AND fight_id NOT IN {tuple(excl_fight_ids)};
            """

        else:
            query = f"""
                SELECT fight_id,
                       fighter_id,
                       round,
                       stat,
                       value
                FROM control_stats
                WHERE stat in {tuple(stats)}
                    AND fight_id IN {tuple(fight_ids)};
            """

        df = pd.read_sql(sql=query, con=conn)

        return df

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_position_stats(
        stats:       List[str],
        fighter_id:  Optional[int],
        opponent_id: Optional[int],
        **kwargs: Any
) -> Optional[pd.DataFrame]:

    fight_ids      = kwargs.get('fight_ids', [])
    excl_fight_ids = kwargs.get('excl_fight_ids', [])

    conn, cur = connect_to_sqlite_db()

    try:
        if len(fight_ids) == 0:
            query = f"""
                SELECT fight_id,
                       round,
                       stat,
                       value
                FROM position_stats
                WHERE stat in {tuple(stats)}
                    AND fighter_id = {fighter_id}
                    AND opponent_id = {opponent_id}
                    AND fight_id NOT IN {tuple(excl_fight_ids)};
            """

        else:
            query = f"""
                SELECT fight_id,
                       fighter_id,
                       round,
                       stat,
                       value
                FROM position_stats
                WHERE stat in {tuple(stats)}
                    AND fight_id IN {tuple(fight_ids)};
            """

        df = pd.read_sql(sql=query, con=conn)

        return df

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_fight_ids_without_stats_in_db() -> List[int]:
    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT ufc_id
            FROM fights f
            WHERE NOT EXISTS (SELECT 1 FROM position_stats ps WHERE ps.fight_id = f.ufc_id)
                AND f.ufc_id IS NOT NULL
        """
        fight_ids = cur.execute(query).fetchall()

        return fight_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)


def get_early_finished_fight_ids(**kwargs: Any) -> List[int]:
    fighter_id = kwargs.get('fighter_id', '%')
    opponent_id = kwargs.get('opponent_id', '%')

    conn, cur = connect_to_sqlite_db(factory_type=FactoryType.LIST)

    try:
        query = f"""
            SELECT fight_id
            FROM striking
            WHERE n = 1
                AND round = 1
                AND stat = 'KOL'
                AND fight_id IN (
                    SELECT fight_id
                    FROM control
                    WHERE round = 1
                        AND n_seconds <= 60
                        AND stat = 'T'
                )
                AND ((fighter_id LIKE '{fighter_id}' AND opponent_id LIKE '{opponent_id}')
                OR  ((fighter_id LIKE '{opponent_id}' AND opponent_id LIKE '{fighter_id}')))
        """
        fight_ids = cur.execute(query).fetchall()

        return fight_ids

    except (Exception, sqlite3.Error) as e:
        logger.error(e)
