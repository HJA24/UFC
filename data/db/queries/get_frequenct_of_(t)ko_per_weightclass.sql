SELECT f.result,
       f.weight_class,
       wc.max * 0.453592 AS max_weight,
       COUNT(*) AS n
FROM fights f
INNER JOIN weight_classes wc
    ON f.weight_class = wc.weight_class
-- WHERE f.result = 'ko/tko'
GROUP BY f.weight_class
ORDER BY max_weight DESC