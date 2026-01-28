WITH opps AS (
    SELECT
        f.fighter_id_blue AS ufc_id,
        f.fighter_id_red  AS opponent_id
    FROM fights f

    UNION ALL

    SELECT
        f.fighter_id_red  AS ufc_id,
        f.fighter_id_blue AS opponent_id
    FROM fights f
),
opps_distinct AS (
    SELECT DISTINCT ufc_id, opponent_id
    FROM opps
),
gender_counts AS (
    SELECT
        me.ufc_id,
        SUM(CASE WHEN opp.gender = 'MALE'   THEN 1 ELSE 0 END) AS n_males,
        SUM(CASE WHEN opp.gender = 'FEMALE' THEN 1 ELSE 0 END) AS n_females
    FROM fighters me
    LEFT JOIN opps_distinct od
        ON od.ufc_id = me.ufc_id
    LEFT JOIN fighters opp
        ON opp.ufc_id = od.opponent_id
    GROUP BY me.ufc_id
),
theoretical AS (
    SELECT
        f.ufc_id,
        f.gender,
        g.n_males,
        g.n_females,
        CASE
            WHEN g.n_males > g.n_females THEN 'MALE'
            ELSE 'FEMALE'
        END AS theo_gender
    FROM fighters f
    LEFT JOIN gender_counts g
        ON g.ufc_id = f.ufc_id
)
SELECT
    ufc_id,
    gender,
    n_males,
    n_females,
    theo_gender,
    (theo_gender = gender) AS matches
FROM theoretical
WHERE matches != 1 or matches IS NULL
ORDER BY n_males DESC;
