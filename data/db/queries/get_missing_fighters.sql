SELECT f.*
FROM fighters f
WHERE f.gender IS NULL
  AND EXISTS (
    SELECT 1
    FROM fights fi
    WHERE fi.fighter_id_blue = f.ufc_id
       OR fi.fighter_id_red  = f.ufc_id
  );