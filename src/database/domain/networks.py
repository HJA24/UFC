import logging
import psycopg
from psycopg import sql
from database.connection import connect_to_postgresql_db
from typing import Dict, List


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def insert_network(fight_id: int, network: Dict) -> None:
    conn, cur = connect_to_postgresql_db()

    nodes    = network['nodes']
    edges    = network['edges']

    parent_table = sql.Identifier('networks')
    parent_pk    = sql.Identifier('network_id')
    child_fk     = sql.Identifier('network_id')

    NETWORK_QUERY = sql.SQL("""
        INSERT INTO {parent_table} (
            fight_id,
            is_connected
        )
        VALUES (%s, %s)
        RETURNING {parent_pk}
    """).format(
        parent_table=parent_table,
        parent_pk=parent_pk,
    )

    try:
        cur.execute(
            NETWORK_QUERY,
            (
                fight_id,
                network['is_connected']
            )
        )
        logger.info(f"fight: {fight_id} - successfully inserted network")

        parent_id = cur.fetchone()[0]

        child_table = sql.Identifier('nodes')

        NODES_QUERY = sql.SQL("""
             INSERT INTO {child_table} (
                 {child_fk},
                 fighter_id,
                 pos_x,
                 pos_y,
                 pos_theta,
                 color,
                 cluster
             )
             VALUES (%s, %s, %s, %s, %s, %s, %s)
         """).format(
            child_table=child_table,
            child_fk=child_fk
        )

        rows = [
            (
                parent_id,
                node['node_id'],
                node['pos_x'],
                node['pos_y'],
                node['pos_theta'],
                node['color'],
                node['cluster']
            ) for node in nodes
        ]

        cur.executemany(NODES_QUERY, rows)
        logger.info(f"fight: {fight_id} - successfully inserted nodes")

        child_table = sql.Identifier('edges')

        EDGES_QUERY = sql.SQL("""
             INSERT INTO {child_table} (
                 {child_fk},
                 u,
                 v,
                 weight
             )
             VALUES (%s, %s, %s, %s)
         """).format(
            child_table=child_table,
            child_fk=child_fk
        )

        rows = [
            (
                parent_id,
                edge['source'],
                edge['target'],
                edge['weight'],
            ) for edge in edges
        ]

        cur.executemany(EDGES_QUERY, rows)
        logger.info(f"fight: {fight_id} - successfully inserted edges")

        properties = network['properties']

        type_fk = sql.Identifier(f"graph_property_type")
        child_table = sql.Identifier(f"graph_properties")

        PROPERTIES_QUERY = sql.SQL("""
            INSERT INTO {child_table} (
                {child_fk},
                {type_fk},
                value
            )
            VALUES (%s, %s, %s)
        """).format(
            child_table=child_table,
            child_fk=child_fk,
            type_fk=type_fk
        )

        rows = [
            (
                parent_id,
                property['property_type_id'].value,
                property['value']
            ) for property in properties
        ]

        cur.executemany(PROPERTIES_QUERY, rows)
        logger.info(f"fight: {fight_id} - successfully inserted properties")

        conn.commit()

    except (Exception, psycopg.Error) as e:
        conn.rollback()
        logger.error(f"fight: {fight_id} - something went wrong while inserting network: {e}")

    finally:
        conn.close()


def insert_matchups(fight_id: int, matchups: List[Dict]) -> None:
    conn, cur = connect_to_postgresql_db()

    try:
        parent_table = sql.Identifier('fight_matchups')

        MATCHUPS_QUERY = sql.SQL("""
            INSERT INTO {parent_table} (
                fight_id,
                event_id,
                fighter_id_blue,
                fighter_id_red,
                winner,
                n_rounds,
                n_seconds,
                outcome
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """).format(
            parent_table=parent_table
        )

        cur.executemany(MATCHUPS_QUERY, matchups)

        conn.commit()
        logger.info(f"fight: {fight_id} - successfully inserted matchups")

    except (Exception, psycopg.Error) as e:
        conn.rollback()
        logger.error(f"fight: {fight_id} - something went wrong while inserting matchups: {e}")

    finally:
        conn.close()
