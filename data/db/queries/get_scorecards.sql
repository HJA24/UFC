WITH blue AS (SELECT s.*
			 FROM scorecards s
			 INNER join fights f
			 ON f.ufc_id = s.fight_id
				AND f.blue = s.fighter_id),
red AS (SELECT s.*
			 FROM scorecards s
			 INNER join fights f
			 ON f.ufc_id = s.fight_id
				AND f.red = s.fighter_id)

SELECT blue.n_points AS n_points_blue, red.n_points AS n_points_red
FROM blue
INNER JOIN red
ON blue.fight_id = red.fight_id
	AND blue.judge_id = red.judge_id
	AND blue.round  = red.round
WHERE blue.judge_id = 14