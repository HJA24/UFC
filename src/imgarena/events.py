import logging
import sys
sys.path.append('/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/database')
from gql import Client
from gql.transport.exceptions import TransportProtocolError
from imgarena import IMGArenaHTTPTransport
from database import insert_imgarena, add_imgid_to_fighter
from typing import Dict


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
    )
logger = logging.getLogger(__name__)


async def insert_fightcard(event_id: int, fightcard: Dict) -> None:
    name = fightcard['getUfcFightCard']['name'].lower()
    fights = fightcard['getUfcFightCard']['fights']

    for fight in fights:
        segment = fight['cardSegment']
        weight_class = fight['weightClass']['description'].lower()
        fight_id = fight['id']
        red = fight['redTeam']['fighter']
        blue = fight['blueTeam']['fighter']

        insert_imgarena(fight={
            'event_id': event_id,
            'event_name': name,
            'segment': segment,
            'weight_class': weight_class,
            'fight_id': fight_id,
            'red': red['id'],
            'blue': blue['id']
        })

        red_first_name = red['firstName'].lower()
        red_last_name = red['lastName'].lower()
        red_name = f'{red_first_name} {red_last_name}'

        blue_first_name = blue['firstName'].lower()
        blue_last_name = blue['lastName'].lower()
        blue_name = f'{blue_first_name} {blue_last_name}'

        add_imgid_to_fighter(name=red_name, imgid=red['id'])
        add_imgid_to_fighter(name=blue_name, imgid=blue['id'])


async def get_fights(event_id: int, insert: bool) -> Dict:
    transport = IMGArenaHTTPTransport(url=f'https://btec-http.services.imgarena.com/',
                                      headers={
                                          'ec-version': '5.1.39 ',
                                          'event-id': f'{event_id}',
                                          'operator': 'img',
                                          'sport': 'UFC'
                                      })
    async with Client(transport=transport,
                      fetch_schema_from_transport=False) as session:

        operation = 'FightCardListGetFightCard'
        query = """
  query FightCardListGetFightCard($input: FightCardInput!) {
    getUfcFightCard(input: $input) {
      name
      fights {
        ...fightCardListGetFightCardFieldsFight
      }
    }
  }
  fragment fightCardListGetFightCardFieldsFight on UfcFight {
    cardSegment
    id
    status
    fightOrder
    weightClass {
      id
      description
      abbreviation
    }
    redTeam {
      ...fightCardListGetFightCardFieldsFighter
    }
    blueTeam {
      ...fightCardListGetFightCardFieldsFighter
    }
    result {
      winner
      method
      methodDetails {
        endingRound
        endingTime
      }
    }
  }
  fragment fightCardListGetFightCardFieldsFighter on UfcTeam {
    fighter {
      id
      lastName
      firstName
      nickName
      country
      recentForm
      rankings {
        weightClass {
          id
        }
        rank
      }
    }
  }
"""
        variables = {
            "input": {
                "fightCardId": event_id}
        }

        try:
            r = await session.execute(
                document=query,
                operation_name=operation,
                variable_values=variables
            )

            if insert:
                await insert_fightcard(event_id=event_id, fightcard=r)

            fights = r['getUfcFightCard']['fights']

            return dict((fight['id'], [
                fight['redTeam']['fighter']['id'],
                fight['blueTeam']['fighter']['id']
            ]) for fight in fights)

        except (KeyError, TransportProtocolError) as e:
            logger.error(e)
            return {}

