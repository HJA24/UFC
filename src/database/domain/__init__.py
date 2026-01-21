# Re-export all functions for backwards compatibility
# Existing imports like `from database.domain import get_fighter` will continue to work

from database.domain.entities import (
    insert_event_record,
    insert_fight_record,
    insert_fighter_record,
    insert_judge_record,
    fighter_record_exists,
    judge_record_exists,
    get_fighter,
    update_image_url_of_fighter,
    get_fighter_ids,
    get_fighter_ids_by_fight,
    get_fight_ids,
    get_fight,
    get_n_rounds,
    get_history,
)

from database.domain.scorecards import (
    insert_score_record,
    insert_scorecard_records,
    insert_decision_records,
    insert_y_records,
    insert_beta_record,
    insert_cutpoint_record,
    scorecard_record_exists,
    get_beta,
    get_cutpoint,
    get_y,
    get_judge_id,
    get_judge_name,
    get_judge_ids,
    get_scorecard_ids,
    get_scorecards,
    get_n_judged_fights,
    get_fight_ids_without_scorecards_in_db,
)

from database.domain.stats import (
    insert_stats_records,
    insert_stats,
    get_stats_records,
    get_striking_stats,
    get_grappling_stats,
    get_control_stats,
    get_position_stats,
    get_fight_ids_without_stats_in_db,
    get_early_finished_fight_ids,
)

from database.domain.markov import (
    insert_edge_records,
    edges_records_exists,
    get_edge_ids,
    get_u_and_v,
    get_weight,
    get_markov_id,
    get_body_part,
    get_submission_technique,
)

from database.domain.predictions import (
    insert_p_records,
    insert_f_record,
    f_record_exists,
    get_p,
    get_prediction_type_ids,
    get_prediction_type,
    insert_predictions_and_hdis,
)

from database.domain.networks import (
    insert_network,
    insert_matchups,
)

from database.domain.betting import (
    get_odds,
    get_operations,
)

from database.domain.identifiers import (
    ufc_identifier_to_mrkv_identifier,
    ufc_identifiers_to_mrkv_identifiers,
)

from database.domain.config import (
    insert_config_record,
    config_record_exists,
    get_config_id,
    get_event_ids_in_db,
)

__all__ = [
    # entities
    'insert_event_record',
    'insert_fight_record',
    'insert_fighter_record',
    'insert_judge_record',
    'fighter_record_exists',
    'judge_record_exists',
    'get_fighter',
    'update_image_url_of_fighter',
    'get_fighter_ids',
    'get_fighter_ids_by_fight',
    'get_fight_ids',
    'get_fight',
    'get_n_rounds',
    'get_history',
    # scorecards
    'insert_score_record',
    'insert_scorecard_records',
    'insert_decision_records',
    'insert_y_records',
    'insert_beta_record',
    'insert_cutpoint_record',
    'scorecard_record_exists',
    'get_beta',
    'get_cutpoint',
    'get_y',
    'get_judge_id',
    'get_judge_name',
    'get_judge_ids',
    'get_scorecard_ids',
    'get_scorecards',
    'get_n_judged_fights',
    'get_fight_ids_without_scorecards_in_db',
    # stats
    'insert_stats_records',
    'insert_stats',
    'get_stats_records',
    'get_striking_stats',
    'get_grappling_stats',
    'get_control_stats',
    'get_position_stats',
    'get_fight_ids_without_stats_in_db',
    'get_early_finished_fight_ids',
    # markov
    'insert_edge_records',
    'edges_records_exists',
    'get_edge_ids',
    'get_u_and_v',
    'get_weight',
    'get_markov_id',
    'get_body_part',
    'get_submission_technique',
    # predictions
    'insert_p_records',
    'insert_f_record',
    'f_record_exists',
    'get_p',
    'get_prediction_type_ids',
    'get_prediction_type',
    'insert_predictions_and_hdis',
    # networks
    'insert_network',
    'insert_matchups',
    # betting
    'get_odds',
    'get_operations',
    # identifiers
    'ufc_identifier_to_mrkv_identifier',
    'ufc_identifiers_to_mrkv_identifiers',
    # config
    'insert_config_record',
    'config_record_exists',
    'get_config_id',
    'get_event_ids_in_db',
]
