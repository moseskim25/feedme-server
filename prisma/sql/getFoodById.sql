SELECT
    f.id,
    f.description,
    f.r2_key,
    json_agg(
        json_build_object(
            'id',
            fg.id,
            'name',
            fg.name,
            'servings',
            fgs.servings
        )
    ) AS food_groups
FROM
    food f
    LEFT JOIN serving fgs ON f.id = fgs.food_id
    LEFT JOIN food_group fg ON fgs.food_group_id = fg.id
WHERE
    f.id = $ 1
GROUP BY
    f.id,
    f.description,
    f.r2_key;
