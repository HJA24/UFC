import os
import logging
import json
import numpy as np
from scripts.markov.edges import build_edges
from scripts.markov.fight import Fight
from scripts.graph import build_G
from scripts.scrape.ufc.events import get_upcoming_event_id
from scripts.scrape.ufc.fights import get_fight_ids, get_n_possible_rounds
from scripts.scrape.ufc.fighters import get_fighter_ids
from scripts.database.database import get_config_id, check_if_edges_is_in_db
from scripts.judging.judge import Judge
from scripts.judging.scorecards import Scorecards, save_scorecards
from scripts.judging.decision import Decisions, save_decisions


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


PATH_MODELS = '/Users/huibmeulenbelt/PycharmProjects/ufc/models'

fight_models   = json.load(open(os.path.join(PATH_MODELS, 'fights', 'models.json')))
judging_models = json.load(open(os.path.join(PATH_MODELS, 'judges', 'models.json')))

graph_id    = 1
fighting_id = 3
judging_id  = 9
judge_ids   = [14, 200, 32]
config_id   = get_config_id(fighting_id=fighting_id, judging_id=judging_id)

fight_model  = fight_models[str(fighting_id)]
judges_model = judging_models[str(judging_id)]


if __name__ == "__main__":
    event_id = get_upcoming_event_id()
    logger.info(f'event: {event_id} - collecting fights')
    fight_ids = get_fight_ids(event_id=event_id)

    for fight_id in fight_ids:
        present_in_db = check_if_edges_is_in_db(fight_id=fight_id, model_id=fighting_id)

        if not present_in_db:
            continue

        blue, red = get_fighter_ids(fight_id=fight_id)
        n_rounds  = get_n_possible_rounds(event_id=event_id, fight_id=fight_id)
        logger.info(f'fight: {fight_id} - creating G')
        edges = build_edges(fight_id=fight_id, model_id=fighting_id, graph_id=graph_id)
        G = build_G(edges=edges, graph_id=graph_id)

        logger.info(f'fight: {fight_id} - creating fight')
        fight = Fight(G=G, n_rounds=n_rounds)

        K = judges_model['K']
        X = np.vstack([
            fight.n_delta(k) for k in K]
        )

        logger.info(f"fight: {fight_id} - calculating scorecards")

        for judge_id in judge_ids:
            judge      = Judge(judge_id=judge_id, model=judges_model)
            scorecards = Scorecards(judge=judge, X=X, n_rounds=n_rounds)

            save_scorecards(
                scorecards=scorecards.p(),
                fight_id=fight_id,
                judge_id=judge_id,
                config_id=config_id
            )

        logger.info(f"fight: {fight_id} - calculating judges' decisions")
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
