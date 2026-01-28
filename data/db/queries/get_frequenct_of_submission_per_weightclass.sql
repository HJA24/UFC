SELECT f.result,
       f.weight_class,
       wc.max * 0.453592 AS max_weight,
       COUNT(*) AS n,
       ROUND(1.0 * COUNT(*) / SUM(COUNT(*)) OVER () * 100, 3) AS p
FROM fights f
INNER JOIN weight_classes wc
    ON f.weight_class = wc.weight_class
WHERE f.result = 'submission'
GROUP BY f.weight_class
ORDER BY max_weight DESC