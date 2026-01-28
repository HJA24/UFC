UPDATE odds
SET fight_id = (SELECT f.ufc_id FROM fights f WHERE f.espn_id = fight_id);


UPDATE odds
SET fighter_id = (SELECT f.ufc_id FROM fighters f WHERE f.espn_id = fighter_id);


UPDATE odds
SET opponent_id = (SELECT f.ufc_id FROM fighters f WHERE f.espn_id = opponent_id);