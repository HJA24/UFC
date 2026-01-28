import os
import logging
import json
from sample import create_coords_and_dims, sample
from weigh_in import get_relevant_stats, get_data, process_data
from diagnostics import check_diagnostics, plot_ppc
from upcoming import get_fight_card
from skills import build_skills
from scripts.scrape.ufc.events import get_upcoming_event_id, get_past_event_ids
from scripts.database.database import check_if_edges_is_in_db, get_early_finished_fight_ids
from scripts.markov.edges import build_weights, save_edges


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


PATH_MODELS = '/Users/huibmeulenbelt/PycharmProjects/ufc/models/'
PATH_DATA   = '/Users/huibmeulenbelt/PycharmProjects/ufc/data/fights/mmarkov'


model_id = 3
n_chains = 4
n_draws  = 1000


if __name__ == "__main__":
    n_samples = n_chains * n_draws
    model = json.load(open(os.path.join(PATH_MODELS, 'fights', f'{model_id}.json')))

    stan_id    = model['stan']['model_id']
    parameters = model['stan']['parameters']
    graph_id    = model['markov']

    try:
        I_grappling = model['stan']['correlation']['grappling']
        I_striking  = model['stan']['correlation']['striking']
    except KeyError:
        I_grappling = None
        I_striking  = None

    stats = get_relevant_stats(model=model)

    event_id = get_upcoming_event_id()
    early_finished_fight_ids = get_early_finished_fight_ids()
    fight_card = get_fight_card(event_id=event_id, early_finished_fight_ids=early_finished_fight_ids)

    if len(fight_card):
        for fight_id in fight_card.keys():
            present_in_db = check_if_edges_is_in_db(fight_id=fight_id, model_id=model_id)

            if present_in_db:
                continue

            fight    = fight_card[fight_id]
            pool     = fight['pool']
            n_rounds = fight['n_rounds']

            pool.select(n_fighters=min(50, pool.n_nodes), incl_all_opponents=False)
            pool.plot()

            blue = pool.blue
            red  = pool.red

            logger.info(f'event: {event_id} - fight: {fight_id} - collecting data')

            df = get_data(
                event_id=event_id,
                fight_id=fight_id,
                h2hs=list(pool.G.edges()),
                stats=stats,
                early_finished_fight_ids=early_finished_fight_ids
            )
            df.to_csv(os.path.join(PATH_DATA, f'{fight_id}.csv'))

            data = process_data(df=df, model=model['stan'])
            N = data['N']

            if I_grappling is not None:
                data['I_grappling'] = I_grappling
                data['I_striking']  = I_striking
                data['n_grappling'] = len(I_grappling)
                data['n_striking']  = len(I_striking)

            fighter_idx = data.pop('fighter_idx')

            coords, dims = create_coords_and_dims(
                fighter_idx=fighter_idx,
                model=model['stan'],
                N=N,
            )

            stan_path = os.path.join(PATH_MODELS, 'fights', 'stan', f'{stan_id}.stan')
            idata = sample(
                data=data,
                path=stan_path,
                n_chains=n_chains,
                n_draws=n_draws,
                dims=dims,
                coords=coords,
                observed_data={
                    'y1': data['y1'],
                    'y2': data['y2'],
                    'n3': data['n3'],
                    'n4': data['n4'],
                    'n5': data['n5'],
                    'n6': data['n6']
                },
                posterior_predictive=[
                    'y1_hat',
                    'y2_hat',
                    'n3_hat',
                    'n4_hat',
                    'n5_hat',
                    'n6_hat'
                ]
            )

            logger.info('checking whether the diagnostics of the fit are good')
            diagnostics = check_diagnostics(fit=idata, parameters=parameters)

            if diagnostics:
                """
                plot_ppc(fit=idata,
                     pairs={
                         'y1': 'y1_hat',
                         'y2': 'y2_hat',
                         'n3': 'n3_hat',
                         'n4': 'n4_hat',
                         'n5': 'n5_hat',
                         'n6': 'n6_hat'
                     })
                """

                skills  = build_skills(fit=idata, blue=blue, red=red)
                weights = build_weights(skills=skills)

                save_edges(
                    fight_id=fight_id,
                    weights=weights,
                    model_id=model_id
                )