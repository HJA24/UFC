import os
import logging
import asyncio
from datetime import datetime
from dateutil import parser
from gql import Client, gql
from gql.client import AsyncClientSession
from imgarena import IMGArenaWebsocketsTransport
from adatabase import connect_to_db, insert
from typing import Dict


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
    )
logger = logging.getLogger(__name__)


QUERIES = '/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/imgarena/schemas/queries'
SUBSCRIPTIONS = '/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/imgarena/schemas/subscriptions'


class EventCenter():
    def __init__(self, event_id: int, fights: Dict):
        self.sport = 'UFC'
        self.event_id = str(event_id)
        self.fights = fights
        self._transport = IMGArenaWebsocketsTransport(url='wss://btec-websocket.services.imgarena.com/',
                                                      headers={
                                                          'accept-language': 'en',
                                                          'ec-version': '5.1.38',
                                                          'operator': 'bet365',
                                                          'reconnect': False,
                                                          'reconnectCount': 0,
                                                          'referrer': 'https://www.bet365.nl/',
                                                          'sport': self.sport
                                                      })
        self._client = Client(transport=self._transport,
                              fetch_schema_from_transport=False)

    async def process_clock(self, fight_id: int, response: Dict) -> None:
        try:
            data = response['subscribeToUfcFightRoundTime']
            time = data['time']
            round = data['currentRound']
            ts = datetime.now()

            clock = {
                'fight_id': fight_id,
                'round': round,
                'time': time,
                'ts': ts
            }

            await insert(
                table='clock',
                record=clock,
                pool=self._pool,
                add_ts=False
            )

        except KeyError:
            return None

    async def subscribe_to_clock(self, fight_id: int, session: AsyncClientSession) -> None:
        subscription = gql(open(os.path.join(SUBSCRIPTIONS, 'clock.graphql')).read())

        async for response in session.subscribe(
                document=subscription,
                operation_name='SubscribeToUfcFightRoundTime',
                subscription_name='subscribeToUfcFightRoundTime',
                variable_values={'input': {
                    'eventId': self.event_id,
                    'fightId': fight_id
                }},
                event_id=self.event_id):

                await self.process_clock(fight_id=fight_id, response=response)

    async def process_stats(self, fight_id: int, response: Dict) -> None:
        try:
            data = response['subscribeToUfcFightStats']
            stats = data['roundStats']
            round = data['currentRound']
            ts = datetime.now()

            for fighter in range(2):
                opponent = fighter ^ 1
                grappling = stats[fighter]['grappling']
                tip = stats[fighter]['time']

                for k, v in grappling.items():
                    stat = {
                        'fight_id': fight_id,
                        'fighter_id': self.fights[fight_id][fighter],
                        'opponent_id': self.fights[fight_id][opponent],
                        'description': k,
                        'landed': v['landed'],
                        'attempted': v['attempted'],
                        'round': round,
                        'ts': ts
                    }

                    await insert(
                        table='grappling',
                        record=stat,
                        pool=self._pool,
                        add_ts=False
                    )

                for k, v in tip.items():
                    minutes, seconds = v['controlTime'].split(':')
                    n_seconds = int(minutes) * 60 + int(seconds)

                    stat = {
                        'fight_id': fight_id,
                        'fighter_id': self.fights[fight_id][fighter],
                        'opponent_id': self.fights[fight_id][opponent],
                        'description': k,
                        'time': v['controlTime'],
                        'seconds': n_seconds,
                        'round': round,
                        'ts': ts
                    }

                    await insert(
                        table='tip',
                        record=stat,
                        pool=self._pool,
                        add_ts=False
                    )

        except KeyError:
            return None

    async def subscribe_to_stats(self, fight_id: int, session: AsyncClientSession) -> None:
        subscription = gql(open(os.path.join(SUBSCRIPTIONS, 'stats.graphql')).read())

        async for response in session.subscribe(
                document=subscription,
                operation_name='StrikesSubscribeToFightStats',
                subscription_name='subscribeToUfcFightStats',
                variable_values={'input': {
                    'eventId': self.event_id,
                    'fightId': fight_id
                }},
                event_id=self.event_id):

                await self.process_strikes(fight_id=fight_id, response=response)

    async def process_strike(self, description: str, values: Dict) -> Dict:
        attempts = values['attempts']
        landed = values['landed']

        # stance
        if 'distance' in description:
            stance = 'distance'
        elif 'clinch' in description:
            stance = 'clinch'
        elif 'ground' in description:
            stance = 'ground'
        else:
            stance = None

        # target
        if 'head' in description:
            target = 'head'
        elif 'body' in description:
            target = 'body'
        elif 'legs' in description:
            target = 'legs'
        else:
            target = None

        # significant
        if 'significant' in description:
            significant = True
        else:
            significant = False

        return {
            'description': description,
            'stance': stance,
            'target': target,
            'significant': significant,
            'attempts': attempts,
            'landed': landed
        }

    async def process_strikes(self, fight_id: int, response: Dict) -> None:
        try:
            data = response['subscribeToUfcFightStats']
            stats = data['roundStats']
            round = data['currentRound']
            ts = datetime.now()

            for fighter in range(2):
                opponent = fighter ^ 1
                strikes = stats[fighter]['strikes']

                for k, v in strikes.items():
                    strike = await self.process_strike(description=k, values=v)
                    strike['fight_id'] = fight_id
                    strike['fighter_id'] = self.fights[fight_id][fighter]
                    strike['opponent_id'] = self.fights[fight_id][opponent]
                    strike['round'] = round
                    strike['ts'] = ts

                    await insert(
                        table='strikes',
                        record=strike,
                        pool=self._pool,
                        add_ts=False
                    )

        except KeyError:
            return None

    async def subscribe_to_strikes(self, fight_id: int, session: AsyncClientSession) -> None:
        subscription = gql(open(os.path.join(SUBSCRIPTIONS, 'strikes.graphql')).read())

        async for response in session.subscribe(
                document=subscription,
                operation_name='StrikesSubscribeToFightStats',
                subscription_name='subscribeToUfcFightStats',
                variable_values={'input': {
                    'eventId': self.event_id,
                    'fightId': fight_id
                }},
                event_id=self.event_id):

                await self.process_strikes(fight_id=fight_id, response=response)




    async def watch(self) -> None:
        self._pool = await connect_to_db()

        async with self._client as session:
            async with asyncio.TaskGroup() as self.tasks:

                for fight in self.fights:
                    fight_id = fight['id']

                    self.tasks.create_task(
                        coro=self.subscribe_to_stats(fight_id=fight_id, session=session),
                        name=f'stats_{fight_id}'
                    )
                    self.tasks.create_task(
                        coro=self.subscribe_to_strikes(fight_id=fight_id, session=session),
                        name=f'strikes_{fight_id}'
                    )

                    self.tasks.create_task(
                        coro=self.subscribe_to_clock(fight_id=fight_id, session=session),
                        name=f'clock_{fight_id}'
                    )

    async def close(self):
        await self._session.close()
        await self._pool.close()

    async def process_clock(self, fight_id: int, response: Dict) -> None:
        try:
            data = response['subscribeToUfcFightRoundTime']
            round = data['currentRound']
            clock = data['time']
            timestamp = data['timestamp']

            self.fights[fight_id]['round'] = round
            self.fights[fight_id]['clock'] = clock
            self.fights[fight_id]['timestamp'] = timestamp

        except KeyError:
            return None

    async def subscribe_to_clock(self, fight_id: int, event_id: int) -> None:
        self.fights[fight_id] = {}

        subscription = gql(open(os.path.join(SUBSCRIPTIONS, 'round_time.graphql')).read())

        async with self._client as session:
            async for response in session.subscribe(
                    document=subscription,
                    operation_name='SubscribeToUfcFightRoundTime',
                    subscription_name='subscribeToUfcFightRoundTime',
                    variable_values={'input': {
                        'fightId': fight_id,
                        'eventId': event_id
                    }},
                    event_id=event_id):
                        await self.process_fight(fight_id=fight_id, response=response)
