import os
import cv2
import matplotlib.pyplot as plt
from scripts.scrape.ufc.fighters import get_fighter_ids, get_fighter_names
from scripts.scrape.ufc.fights import get_n_rounds, get_event_id
from scripts.database.database import insert_scorecards, insert_judge, check_if_scorecard_is_in_db, check_if_judge_is_in_db, get_judge_id


SCORECARDS_PATH = '/Users/huibmeulenbelt/PycharmProjects/ufc/data/scorecards'


YEAR = 2025


if __name__ == '__main__':
    scorecards = os.listdir(f'{SCORECARDS_PATH}/{YEAR}')

    for scorecard in scorecards:
        if scorecard == '.DS_Store':
            continue
        elif scorecard == 'labelled':
            continue

        img = cv2.imread(os.path.join(SCORECARDS_PATH, str(YEAR), scorecard), cv2.IMREAD_UNCHANGED)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        plt.figure(figsize=(7, 7))
        plt.imshow(img)

        fight_id = int(scorecard.split('.')[0])
        red_id, blue_id     = get_fighter_ids(fight_id=fight_id)
        red_name, blue_name = get_fighter_names(fight_id=fight_id)

        n_rounds = get_n_rounds(fight_id=fight_id)

        if n_rounds is None:
            continue

        plt.title(f'{fight_id}: {red_name} vs {blue_name}')
        plt.show()

        for j in range(1, 4):
            judge_name = input(f'name of judge {j}:\t')

            present_in_db = check_if_judge_is_in_db(name=judge_name)

            if not present_in_db:
                judge_id = input(f'id of judge {j}:\t')
                judge = {
                    'judge_id': judge_id,
                    'name': judge_name
                }
                insert_judge(judge=judge)

            else:
                judge_id = get_judge_id(name=judge_name)

                present_in_db = check_if_scorecard_is_in_db(fight_id=fight_id, judge_id=judge_id)

                if present_in_db:
                    continue

            for round in range(1, n_rounds):
                while True:
                    score = input(f'judge {j} - round {round} - score:\t')

                    try:
                        n_points_red, n_points_blue = score.split('-')
                        break

                    except:
                        continue

                scorecards = [
                    {
                        'fight_id': fight_id,
                        'judge_id': judge_id,
                        'fighter_id': red_id,
                        'round': round,
                        'n_points': n_points_red
                    },
                    {
                        'fight_id': fight_id,
                        'judge_id': judge_id,
                        'fighter_id': blue_id,
                        'round': round,
                        'n_points': n_points_blue
                    }
                ]

                insert_scorecards(scorecards=scorecards)

        os.replace(
            os.path.join(SCORECARDS_PATH, str(YEAR), scorecard),
            os.path.join(SCORECARDS_PATH, str(YEAR), 'labelled', f'{fight_id}.jpg')
        )



