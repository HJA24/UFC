import json
import numpy as np


PATH_DATA   = '/Users/huibmeulenbelt/PycharmProjects/ufc/mmarkov/mmarkov/judging/data.json'
PATH_SCORES = '/Users/huibmeulenbelt/PycharmProjects/ufc/mmarkov/mmarkov/judging/scores.json'

with open(PATH_DATA) as f:
    data = json.load(f)
with open(PATH_SCORES) as f:
    scores = json.load(f)


blue_ids = list(scores["blue"]["3"])
red_ids  = list(scores["red"]["3"])

p_blue = np.sum([data[str(i)]['p'] for i in blue_ids], axis=0)
p_red  = np.sum([data[str(i)]['p'] for i in red_ids],  axis=0)

a = 1