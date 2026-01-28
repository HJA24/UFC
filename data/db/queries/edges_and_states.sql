SELECT g.edge_id, g.u, m1. abbreviation, m1.fighter, g.v, m2.abbreviation, m2.fighter
FROM graphs g
INNER JOIN markov m1
ON m1.markov_id = g.u
INNER JOIN markov m2
ON m2.markov_id = g.v
WHERE g.graph_id = 1