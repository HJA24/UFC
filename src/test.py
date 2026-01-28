import json
from networkx.readwrite import json_graph
from enums import Period
from scripts.markov.fight import Fight
from stats.stats import extract_stats_and_hdis
from database.database import insert_stats


fight_id  = 12120
n_rounds  = 3
n_seconds = 300
dt        = 1
n         = n_rounds * n_seconds * dt

PATH_G = '/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/markov/tests/12120.json'
G = json_graph.adjacency_graph(json.load(open(PATH_G)))

probabilities = [
    0.5,
    0.75,
    0.9,
    0.95
]

fight = Fight(G=G, n_rounds=n_rounds, t=n_seconds, dt=dt)
stats = extract_stats_and_hdis(
    fight_id=fight_id,
    fight=fight,
    probabilities=probabilities,
    period=Period.FIGHT,
    round=None
)


striking_stats  = stats["STRIKING"]
grappling_stats = stats["GRAPPLING"]
control_stats   = stats["CONTROL"]

insert_stats(category="striking",  stats=striking_stats)
insert_stats(category="grappling", stats=grappling_stats)
insert_stats(category="control",   stats=control_stats)



