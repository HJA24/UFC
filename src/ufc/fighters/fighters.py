import requests
from database.crud import update_table_with_mrkv_identifier
from database.domain import insert_fighter_record
from ufc.fighters.images import process_image
from typing import Any, Dict, List, Literal, Optional, Tuple


PATH_UFC = '/Users/huibmeulenbelt/PycharmProjects/ufc/data/fights/ufc'


def _build_fighter_record(
        ufc_id:        int,
        first_name:    str,
        last_name:     str,
        gender:        str,
        nationality:   Optional[str],
        date_of_birth: Optional[str],
        image_url:     Optional[str],
        **kwargs: Any
) -> Dict:
    img_id =        kwargs.get('img_id', None)

    record = {
        'ufc_id':        ufc_id,
        'mrkv_id':       None,
        'img_id':        img_id,
        'first_name':    first_name,
        'last_name':     last_name,
        'gender':        gender.upper(),
        'nationality':   nationality,
        'date_of_birth': date_of_birth,
        'image_url':     image_url
    }

    return record


def get_fighter(fighters: List[Dict], corner: Literal['blue', 'red']) -> Dict:
    return [fighter for fighter in fighters if fighter['Corner'].lower() == corner][0]


def get_fighter_ids(fight_id: int) -> Optional[Tuple[int, int]]:
    URL = f'https://d29dxerjsp82wz.cloudfront.net/api/v3/fight/live/{fight_id}.json'

    r = requests.get(url=URL)

    if r.status_code == 200:
        data = r.json()

        fighters = data['LiveFightDetail']['Fighters']

        fighter_blue = get_fighter(fighters=fighters, corner='blue')
        fighter_red  = get_fighter(fighters=fighters, corner='red')

        return fighter_blue['FighterId'], fighter_red['FighterId']


def get_winner(fighters: List[Dict]) -> Optional[int]:
    try:
        winner = [fighter['FighterId'] for fighter in fighters if fighter['Outcome']['Outcome'] == 'Win'][0]
    except IndexError:
        winner = None

    return winner


def get_fighter_record(data: Dict) -> Optional[Dict]:
    ufc_id        = data['FighterId']
    date_of_birth = data['DOB']

    try:
        last_name  = data['Name']['LastName'].lower()
        first_name = data['Name']['FirstName'].lower()
    except AttributeError:
        return None

    try:
        nationality = data['Born']['Country'].lower()
    except AttributeError:
        nationality = None

    name = f'{first_name} {last_name}'
    image_url = process_image(fighter_id=ufc_id, fighter_name=name)

    gender = input(f'gender of {name} ({image_url}: \t')

    fighter_record = _build_fighter_record(
        ufc_id=ufc_id,
        first_name=first_name,
        last_name=last_name,
        gender=gender,
        date_of_birth=date_of_birth,
        nationality=nationality,
        image_url=image_url
    )

    return fighter_record


def process_fighter(data: Dict) -> None:
    fighter_record = get_fighter_record(data=data)

    insert_fighter_record(fighter=fighter_record, db_type='sqlite')

    del fighter_record['img_id']
    del fighter_record['mrkv_id']

    mrkv_id = insert_fighter_record(fighter=fighter_record, db_type='postgresql')

    update_table_with_mrkv_identifier(
        table='fighters',
        mrkv_id=mrkv_id,
        ufc_id=fighter_record['ufc_id']
    )
