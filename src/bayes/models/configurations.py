import os
import json
import itertools
from database.domain import config_record_exists, insert_config_record
from typing import Dict


PATH_MODELS = '/Users/huibmeulenbelt/PycharmProjects/ufc/models'


def _build_config_record(
    config_id: int,
    fight_model_id: int,
    judge_model_id: int
) -> Dict:

    record = {
        'config_id':      config_id,
        'fight_model_id': fight_model_id,
        'judge_model_id': judge_model_id
    }

    return record


fight_models   = json.load(open(os.path.join(PATH_MODELS, 'fights', 'models.json')))
judging_models = json.load(open(os.path.join(PATH_MODELS, 'judges', 'models.json')))

fight_model_ids   = list(fight_models.keys())
judging_model_ids = list(judging_models.keys())


for i, (fight_model_id, judge_model_id) in enumerate(itertools.product(fight_model_ids, judging_model_ids), start=1):
    exists = config_record_exists(config_id=i)

    if exists:
        continue

    config_record = _build_config_record(
        config_id=i,
        fight_model_id=fight_model_id,
        judge_model_id=judge_model_id
    )

    insert_config_record(config=config_record, db_type='sqlite')

