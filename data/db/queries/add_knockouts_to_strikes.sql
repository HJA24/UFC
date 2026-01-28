UPDATE strikes 
SET landed = kos.n
	FROM (SELECT 1 AS n,  ufc_id, winner, rounds
					FROM fights
					WHERE result = 'ko/tko') AS kos
WHERE strikes.description = 'knockout'
AND strikes.fight_id = kos.ufc_id
AND strikes.fighter_id = kos.winner
AND strikes.round = kos.rounds