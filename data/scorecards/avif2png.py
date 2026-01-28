import os
from PIL import Image
import pillow_avif


SCORECARDS_PATH = '/Users/huibmeulenbelt/PycharmProjects/ufc/data/scorecards'


YEAR = 2025


scorecards = os.listdir(os.path.join(SCORECARDS_PATH, str(YEAR)))

for scorecard in scorecards:
    if scorecard == '.DS_Store':
        continue
    elif '.png' in scorecard:
        continue
    elif '.jpg' in scorecard:
        continue
    elif scorecard == 'labelled':
        continue

    fight_id = scorecard.split('.')[0]
    img = Image.open(os.path.join(SCORECARDS_PATH, str(YEAR), scorecard))
    img.save(os.path.join(SCORECARDS_PATH, str(YEAR), f'{fight_id}.png'))

    os.remove(os.path.join(SCORECARDS_PATH, str(YEAR), scorecard))