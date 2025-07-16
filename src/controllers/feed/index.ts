import { Request, Response } from "express";
import { pool } from "@/lib/db";
import { getUserIdFromRequest } from "@/src/utils/auth";

type FeedData = Record<string, {
  food: {
    description: string;
    r2_key: string;
    id: number;
  }[];
  symptoms: {
    description: string;
  }[];
  food_groups: Array<{
    name: string;
    servings: number;
  }>;
}>;

type FeedResponse = {
  data: FeedData;
  nextOffset: number | null;
} | {
  error: string;
};

const LIMIT = 2;

const feedController = async (req: Request, res: Response<FeedResponse>) => {
  try {
    const userId = getUserIdFromRequest(req);
    const offset = Number(req.query.offset);
    const today = req.query.today as string;

    const query = `
      WITH date_range AS (
        SELECT DISTINCT logical_date
        FROM food
        WHERE user_id = $1
        ORDER BY logical_date DESC
        LIMIT ${LIMIT}
        OFFSET $2
      ),
      all_dates AS (
        SELECT logical_date FROM date_range
        ${
          offset === 0 && today
            ? `UNION SELECT $3::text WHERE $3::text NOT IN (SELECT logical_date FROM date_range)`
            : ""
        }
      ),
      food_data AS (
        SELECT logical_date, json_agg(json_build_object('description', description, 'r2_key', r2_key, 'id', id)) as foods
        FROM food
        JOIN all_dates USING (logical_date)
        WHERE user_id = $1 AND deleted_at IS NULL
        GROUP BY logical_date
      ),
      food_group_data AS (
        SELECT 
          logical_date,
          json_agg(
            json_build_object(
              'name', name,
              'servings', total_servings
            )
          ) as food_groups
        FROM (
          SELECT 
            f.logical_date,
            fg.name,
            SUM(fgs.servings) as total_servings
          FROM food f
          JOIN all_dates USING (logical_date)
          JOIN food_group_serving fgs ON f.id = fgs.food_id
          JOIN food_group fg ON fgs.food_group_id = fg.id
          WHERE f.user_id = $1 AND f.deleted_at IS NULL
          GROUP BY f.logical_date, fg.name
        ) summed_data
        GROUP BY logical_date
      ),
      symptom_data AS (
        SELECT logical_date, json_agg(json_build_object('description', description)) as symptoms
        FROM symptom
        JOIN all_dates USING (logical_date)
        WHERE user_id = $1
        GROUP BY logical_date
      )
      SELECT 
        d.logical_date,
        COALESCE(f.foods, '[]'::json) as foods,
        COALESCE(s.symptoms, '[]'::json) as symptoms,
        COALESCE(fg.food_groups, '[]'::json) as food_groups
      FROM all_dates d
      LEFT JOIN food_data f USING (logical_date)
      LEFT JOIN symptom_data s USING (logical_date)
      LEFT JOIN food_group_data fg USING (logical_date)
      ORDER BY d.logical_date DESC;
    `;
    const params = offset === 0 && today ? [userId, offset, today] : [userId, offset];
    const result = await pool.query(query, params);

    const data = result.rows.reduce((acc, row) => {
      acc[row.logical_date] = {
        food: row.foods,
        symptoms: row.symptoms,
        food_groups: row.food_groups,
      };
      return acc;
    }, {});

    const noMoreRows = result.rows.length < LIMIT;
    res.status(200).json({
      data,
      nextOffset: noMoreRows ? null : offset + LIMIT,
    });
  } catch (err) {
    console.error("Error in feedController:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { feedController };
