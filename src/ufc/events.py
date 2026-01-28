import os
import json
import logging
import configparser
import requests
from dateutil import parser
from lxml import html
from ufc.fights import get_fight, get_fight_record
from database.domain import insert_event_record
from typing import Dict, List, Optional

try:
    import boto3
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

logger = logging.getLogger(__name__)

PATH_EVENTS = '/Users/huibmeulenbelt/PycharmProjects/ufc/data/events/'
PATH_AWS_CONFIG = '/database/config/aws.ini'


def _get_s3_client():
    """Get S3 client using credentials from aws.ini."""
    if not BOTO3_AVAILABLE:
        raise ImportError("boto3 not installed")

    config = configparser.ConfigParser()
    config.read(PATH_AWS_CONFIG)

    return boto3.client(
        's3',
        aws_access_key_id=config['aws']['access_key_id'],
        aws_secret_access_key=config['aws']['secret_access_key'],
        region_name=config['aws']['region']
    )


def _get_s3_bucket() -> str:
    """Get S3 bucket name for events."""
    return 'mmarkov-data-events'


headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}


def _build_event_record(
        ufc_id:  int,
        name:    str,
        dt:      str,
        venue:   str,
        city:    str,
        country: str
) -> Dict:
    record = {
        'ufc_id':  ufc_id,
        'name':    name,
        'dt':      dt,
        'venue':   venue,
        'city':    city,
        'country': country
    }

    return record


def get_event_record(data: Dict) -> Dict:
    ufc_id = data['EventId']
    name   = data['Name'].lower()
    dt     = str(parser.parse(data['StartTime']).date())

    venue   = data['Location'].get('Venue', None)
    city    = data['Location'].get('City', None)
    country = data['Location'].get('Country', None)

    event_record = _build_event_record(
        ufc_id=ufc_id,
        name=name,
        dt=dt,
        venue=venue,
        city=city,
        country=country
    )

    return event_record


def get_past_event_ids() -> List[int]:
    URL = 'https://www.ufc.com/events#events-list-past'

    r = requests.get(url=URL, headers=headers)
    tree = html.fromstring(r.content)

    events = tree.xpath('//div[@class="c-card-event--result__actions"]//a//@href')
    events = [event for event in events if event.startswith('/event/ufc')]

    event_ids = [int(event.split('#')[1]) for event in events]

    return event_ids


def get_upcoming_event_id() -> int:
    URL = 'https://www.ufc.com'
    r = requests.get(url=f'{URL}/events#events-list-upcoming', headers=headers)
    tree = html.fromstring(r.content)

    events = tree.xpath('//h3[@class="c-card-event--result__headline"]//a//@href')
    event  = events[0]

    r = requests.get(url=f'{URL}{event}', headers=headers)
    tree = html.fromstring(r.content)
    ids = tree.xpath('//*[@id="c-listing-ticker"]//@data-fmid')

    upcoming_event_id = int(ids[0])

    return upcoming_event_id


def get_event(event_id: int) -> Optional[Dict]:
    try:
        return json.load(open(os.path.join(PATH_EVENTS, f'{event_id}.json')))

    except FileNotFoundError:
        URL = f'https://d29dxerjsp82wz.cloudfront.net/api/v3/event/live/{event_id}.json'
        r = requests.get(url=URL)

        if r.status_code == 200:
            return r.json()['LiveEventDetail']


def get_fight_ids(event_id: int) -> List[int]:
    event = get_event(event_id=event_id)

    fights = event['FightCard']

    return [fight['FightId'] for fight in fights]


def get_fights(event_id: int) -> List[Dict]:
    fight_ids = get_fight_ids(event_id=event_id)

    fight_records: List[Dict] = []

    for fight_id in fight_ids:
        fight        = get_fight(fight_id=fight_id)
        fight_record = get_fight_record(fight_id=fight_id, data=fight)
        fight_records.append(fight_record)

    return fight_records


def save_event_locally(event_id: int) -> None:
    """Save event JSON to local filesystem."""
    event = get_event(event_id=event_id)

    with open(os.path.join(PATH_EVENTS, f'{event_id}.json'), 'w') as f:
        json.dump(event, f)


def save_event_externally(event_id: int) -> bool:
    """Save event JSON to S3 bucket. Returns True on success."""
    try:
        event = get_event(event_id=event_id)

        s3_client = _get_s3_client()
        bucket = _get_s3_bucket()

        s3_client.put_object(
            Bucket=bucket,
            Key=f'{event_id}.json',
            Body=json.dumps(event),
            ContentType='application/json'
        )
        logger.info(f'Uploaded event {event_id} to s3://{bucket}/')
        return True

    except Exception as e:
        logger.warning(f'Failed to upload event {event_id} to S3: {e}')
        return False


def process_event(event_id: int) -> None:
    save_event_locally(event_id=event_id)
    save_event_externally(event_id=event_id)

    event        = get_event(event_id=event_id)
    event_record = get_event_record(data=event)

    mkrv_id = insert_event_record(event=event_record, db_type='postgresql')
    event_record['mrkv_id'] = mkrv_id
    insert_event_record(event=event_record, db_type='sqlite')
