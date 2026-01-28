import os
import json
import numpy as np
from networkx.readwrite import json_graph
from scripts.database.database import get_config_id
from scripts.judging.decision import Decisions, save_decisions
from scripts.markov.fight import Fight


PATH_MODELS = '/Users/huibmeulenbelt/PycharmProjects/ufc/models'
PATH_SCORES = '/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/judging/scores.json'


fight_models   = json.load(open(os.path.join(PATH_MODELS, 'fights', 'models.json')))
judging_models = json.load(open(os.path.join(PATH_MODELS, 'judges', 'models.json')))

fighting_id = 3
judging_id  = 9
config_id   = get_config_id(fighting_id=fighting_id, judging_id=judging_id)

fight_model   = fight_models[str(fighting_id)]
judging_model = judging_models[str(judging_id)]

fight_id  = 12508
judge_ids = [14, 200, 32]
n_rounds = 3

PATH_G = '/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/markov/tests/12120.json'
G = json_graph.adjacency_graph(json.load(open(PATH_G)))


fight = Fight(G=G, n_rounds=n_rounds)
K = judging_model['K']

X = np.vstack([
    fight.n_delta(stat=k) for k in K
])


decision = Decisions(
    fight_id=fight_id,
    config_id=config_id,
    judge_ids=judge_ids,
    n_rounds=n_rounds
)
p = decision.p_decisions

save_decisions(decisions=p, fight_id=fight_id, config_id=config_id)


d = {k: v.tolist() for k, v in p.items()}

with open(f'judges_{fight_id}.json', "w") as f:
    json.dump(d, f)
