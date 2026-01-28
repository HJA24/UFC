import json
import numpy as np
import arviz as az


decisions = json.load(open('/Users/huibmeulenbelt/PycharmProjects/ufc/mmarkov/mmarkov/judging/decision/12508.json'))

ps = [0.5, 0.75, 0.9, 0.95]


split_blue = decisions['381']

for p in ps:
    hdi = az.hdi(np.array(split_blue), p)
    print(hdi)