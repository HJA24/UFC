import os
import json
import logging
import configparser
import pandas as pd
import requests
from datetime import datetime
from ufc.fighters.fighters import get_fighter, get_winner
from src.helper import clock2n_secs
from database.domain import insert_fight_record
from typing import Dict, List, Optional

try:
    import boto3
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

logger = logging.getLogger(__name__)

PATH_FIGHTS = '/Users/huibmeulenbelt/PycharmProjects/ufc/data/fights/ufc/'
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
    """Get S3 bucket name for fights."""
    return 'mmarkov-data-fights'


def _build_fight_record(
        ufc_id:          int,
        description:     str,
        fighter_id_blue: int,
        fighter_id_red:  int,
        winner_id:       int,
        weight_class:    str,
        gender:          str,
        n_rounds:        int,
        n_seconds:       int,
        outcome:         str,
        event_id:        int,
        fight_card:      str
) -> Dict:
    record = {
        'ufc_id':          ufc_id,
        'description':     description,
        'fighter_id_blue': fighter_id_blue,
        'fighter_id_red':  fighter_id_red,
        'winner_id':       winner_id,
        'weight_class':    weight_class,
        'gender':          gender,
        'n_rounds':        n_rounds,
        'n_seconds':       n_seconds,
        'outcome':         outcome,
        'event_id':        event_id,
        'fight_card':      fight_card
    }

    return record


def get_fight_record(
        fight_id: int,
        data:     Dict
) -> Dict:
    fighters = data['Fighters']

    fighter_blue = get_fighter(fighters=fighters, corner='blue')
    fighter_red  = get_fighter(fighters=fighters, corner='red')

    fighter_name_red = fighter_red['Name']['LastName'].lower()
    fighter_id_red   = fighter_red['FighterId']

    fighter_name_blue = fighter_blue['Name']['LastName'].lower()
    fighter_id_blue   = fighter_blue['FighterId']

    winner_id = get_winner(fighters=fighters)
    description = f"{fighter_name_blue} vs {fighter_name_red}"

    weight_class = get_weight_class(fight_id=fight_id)
    gender       = get_gender(fight_id=fight_id)
    n_rounds     = get_n_rounds(fight_id=fight_id)
    n_seconds    = get_n_seconds(fight_id=fight_id)
    outcome      = get_outcome(fight_id=fight_id)
    event_id     = get_event_id(fight_id=fight_id)
    fight_card   = get_fight_card(fight_id=fight_id)

    fight_record = _build_fight_record(
        ufc_id=fight_id,
        description=description,
        fighter_id_blue=fighter_id_blue,
        fighter_id_red=fighter_id_red,
        winner_id=winner_id,
        weight_class=weight_class,
        gender=gender,
        n_rounds=n_rounds,
        n_seconds=n_seconds,
        outcome=outcome,
        event_id=event_id,
        fight_card=fight_card
    )

    return fight_record


def get_fight(fight_id: int) -> Dict:
    try:
        return json.load(open(os.path.join(PATH_FIGHTS, f'{fight_id}.json')))

    except FileNotFoundError:
        URL = f'https://d29dxerjsp82wz.cloudfront.net/api/v3/fight/live/{fight_id}.json'
        r = requests.get(url=URL)

        if r.status_code == 200:
            return r.json()['LiveFightDetail']


def get_outcome(fight_id: int) -> Optional[str]:
    fight = get_fight(fight_id)

    try:
        outcome = fight['Result'].upper()

        if outcome == 'KO/TKO':
            return 'KNOCKOUT'

        elif outcome == 'DQ':
            return 'DECISION'

        else:
            return outcome

    except KeyError:
        return None


def get_n_seconds(fight_id: int) -> Optional[int]:
    fight = get_fight(fight_id)

    try:
        clock = fight['Result']['EndingTime']
        n_seconds = clock2n_secs(mmss=clock)

        return n_seconds

    except KeyError:
        return None


def get_gender(fight_id: int) -> Optional[str]:
    fight = get_fight(fight_id)

    try:
        gender = 'FEMALE' if 'women' in fight['WeightClass']['Description'].lower() else 'MALE'
        return gender

    except KeyError:
        return None


def get_fight_card(fight_id: int) -> Optional[str]:
    fight = get_fight(fight_id)

    try:
        fight_card = fight['CardSegment'].upper()

        if fight_card == 'PRELIMS1':
            return 'PRELIM'

        elif fight_card == 'PRELIM2S':
            return 'EARLY_PRELIM'

        else:
            return fight_card

    except KeyError:
        return None


def get_weight_class(fight_id: int) -> Optional[str]:
    fight = get_fight(fight_id)

    try:
        return fight['WeightClass']['Description'].upper()

    except KeyError:
        return None


def get_n_possible_rounds(fight_id: int) -> Optional[int]:
    fight = get_fight(fight_id=fight_id)

    try:
        return fight['RuleSet']['PossibleRounds']

    except KeyError:
        return None


def get_n_rounds(fight_id: int) -> Optional[int]:
    fight = get_fight(fight_id=fight_id)

    try:
        return fight['Result']['EndingRound']

    except KeyError:
        return None


def get_event_id(fight_id: int) -> Optional[int]:
    fight = get_fight(fight_id=fight_id)

    try:
        return fight['Event']['EventId']

    except KeyError:
        return None


def save_fight_locally(fight_id: int) -> None:
    """Save fight JSON to local filesystem."""
    fight = get_fight(fight_id=fight_id)

    with open(os.path.join(PATH_FIGHTS, f'{fight_id}.json'), 'w') as f:
        json.dump(fight, f)


def save_fight_externally(fight_id: int) -> bool:
    """Save fight JSON to S3 bucket. Returns True on success."""
    try:
        fight = get_fight(fight_id=fight_id)

        s3_client = _get_s3_client()
        bucket = _get_s3_bucket()

        s3_client.put_object(
            Bucket=bucket,
            Key=f'{fight_id}.json',
            Body=json.dumps(fight),
            ContentType='application/json'
        )
        logger.info(f'Uploaded fight {fight_id} to s3://{bucket}/')
        return True

    except Exception as e:
        logger.warning(f'Failed to upload fight {fight_id} to S3: {e}')
        return False


def process_fight(fight_id: int) -> None:
    save_fight_locally(fight_id=fight_id)
    save_fight_externally(fight_id=fight_id)

    fight        = get_fight(fight_id=fight_id)
    fight_record = get_fight_record(fight_id=fight_id, data=fight)

    insert_fight_record(fight=fight_record, db_type='sqlite')