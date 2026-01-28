UPDATE grappling
SET landed = submissions.n 
	FROM (SELECT 1 AS n,  ufc_id, winner, rounds
						FROM fights
						WHERE result = 'submission') AS submissions
	WHERE grappling.description = 'n_submissions'
	AND grappling.fight_id = submissions.ufc_id
	AND grappling.fighter_id = submissions.winner
	AND grappling.round = submissions.rounds;
	
	
	
UPDATE grappling
SET landed = 0
WHERE description = 'n_submissions'
	AND landed IS NULL