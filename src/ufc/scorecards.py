import os
import json
from concurrent.futures import ThreadPoolExecutor
from database.domain import get_fight_ids_without_scorecards_in_db, insert_scorecard_records, judge_record_exists, insert_judge_record
from typing import List, Dict


PATH_FIGHTS = '/Users/huibmeulenbelt/PycharmProjects/ufc/data/fights/ufc/'


def _build_judge_record(
        ufc_id:     int,
        first_name: str,
        last_name:  str
) -> Dict:
    name = f'{first_name} {last_name}'

    record = {
        'ufc_id':  ufc_id,
        'mrkv_id': None,
        'name':    name
    }

    return record


def _build_scorecard_record(
        fight_id:   int,
        judge_id:   int,
        fighter_id: int,
        round:      int,
        n_points:   int
) -> Dict:
    record = {
        'fight_id': fight_id,
        'judge_id': judge_id,
        'fighter_id': fighter_id,
        'round': round,
        'n_points': n_points
    }

    return record


def process_judge(judge_id: int, data: Dict) -> None:
    first_name = data['JudgeFirstName'].lower()
    last_name = data['JudgeLastName'].lower()

    judge_record = _build_judge_record(
        ufc_id=judge_id,
        first_name=first_name,
        last_name=last_name
    )
    insert_judge_record(judge=judge_record, db_type='sqlite')



def get_scorecard_records(fight_id: int) -> List[Dict]:
    scorecard_records = []

    data = json.load(open(os.path.join(PATH_FIGHTS, f'{fight_id}.json')))

    result = data['Result']
    judges = result['RoundScores']

    if len(judges) == 0:
        return []

    for judge in judges:
        judge_id = judge['JudgeId']

        exists = judge_record_exists(
            source='ufc',
            judge_id=judge_id,
            db_type='sqlite'
        )

        if not exists:
            process_judge(judge_id=judge_id, data=judge)

        rounds = judge['Rounds']

        for round in rounds:
            try:
                fighters = round['Fighters']
                round    = round['RoundNumber']
            except KeyError:
                continue

            for fighter in fighters:
                fighter_id = fighter['FighterId']
                n_points   = fighter['Score']

                scorecard_record = _build_scorecard_record(
                    fight_id=fight_id,
                    judge_id=judge_id,
                    fighter_id=fighter_id,
                    round=round,
                    n_points=n_points
                )
                scorecard_records.append(scorecard_record)

    return scorecard_records


def process_scorecards(fight_id: int, db_type: str) -> None:
    try:
        scorecard_records = get_scorecard_records(fight_id=fight_id)
        insert_scorecard_records(scorecards=scorecard_records, db_type=db_type)

    except IndexError:
        return None


""""
def get_missing_scorecards() -> None:
    missing_fight_ids = get_fight_ids_without_scorecards_in_db()

    if missing_fight_ids is not None:
        with ThreadPoolExecutor(max_workers=5) as exe:
            futures = [exe.submit(process_scorecards, fight_id) for fight_id in missing_fight_ids]
"""