import { pool } from "@/lib/db";
import {
  deleteFoodEntry,
  getFoodById,
  isFoodOwnedByUser,
} from "@/src/services/food";
import { upsertServingForFood } from "@/src/services/serving";
import { getUserIdFromRequest } from "@/src/utils/auth";
import { Request, Response } from "express";

type FoodDay = {
  food: {
    description: string;
    r2_key: string;
    id: number;
  }[];
  symptoms: {
    id: number;
    description: string;
  }[];
  food_groups: Array<{
    name: string;
    servings: number;
  }>;
};

type FoodData = Record<string, FoodDay>;

type FoodResponse = {
  data: FoodData;
  nextOffset: number | null;
} | {
  error: string;
};

const LIMIT = 2;

const foodController = async (req: Request, res: Response<FoodResponse>) => {
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
            food.logical_date,
            fg.name,
            SUM(fgs.servings) as total_servings
          FROM food
          JOIN all_dates USING (logical_date)
          JOIN serving fgs ON food.id = fgs.food_id
          JOIN food_group fg ON fgs.food_group_id = fg.id
          WHERE food.user_id = $1 AND food.deleted_at IS NULL
          GROUP BY food.logical_date, fg.name
        ) summed_data
        GROUP BY logical_date
      ),
      symptom_data AS (
        SELECT logical_date, json_agg(json_build_object('id', id, 'description', description)) as symptoms
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

    const data: Record<string, FoodDay> = {};
    result.rows.forEach((row) => {
      data[row.logical_date] = {
        food: row.foods,
        symptoms: row.symptoms,
        food_groups: row.food_groups,
      };
    });

    const noMoreRows = result.rows.length < LIMIT;
    res.status(200).json({
      data,
      nextOffset: noMoreRows ? null : offset + LIMIT,
    });
  } catch (err) {
    console.error("Error in foodController:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteFoodEntryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await deleteFoodEntry(Number.parseInt(id, 10));

    res.status(200).json({ message: "Food entry deleted" });
  } catch (err) {
    console.error("Error in deleteFoodEntryController:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getFoodByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const foodEntry = await getFoodById(Number.parseInt(id, 10));

    if (!foodEntry) {
      return res.status(404).json({ message: "Food entry not found" });
    }

    res.status(200).json(foodEntry);
  } catch (err) {
    console.error("Error in getFoodByIdController:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateFoodServingController = async (
  req: Request<{ id: string }, {}, { food_group_id: number; servings: number }>,
  res: Response
) => {
  try {
    const userId = getUserIdFromRequest(req);
    const foodId = Number(req.params.id);
    const foodGroupId = Number(req.body.food_group_id);
    const servings = Number(req.body.servings);

    if (!Number.isFinite(foodId)) {
      return res.status(400).json({ message: "Invalid food id" });
    }

    if (!Number.isFinite(foodGroupId)) {
      return res.status(400).json({ message: "Invalid food group id" });
    }

    if (!Number.isFinite(servings)) {
      return res.status(400).json({ message: "Invalid servings value" });
    }

    const ownsFood = await isFoodOwnedByUser(foodId, userId);

    if (!ownsFood) {
      return res.status(404).json({ message: "Food entry not found" });
    }

    const updatedServing = await upsertServingForFood({
      userId,
      foodId,
      foodGroupId,
      servings,
    });

    return res.status(200).json({
      food_id: foodId,
      food_group_id: foodGroupId,
      servings: updatedServing?.servings ?? 0,
    });
  } catch (err) {
    console.error("Error in updateFoodServingController:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  foodController,
  deleteFoodEntryController,
  getFoodByIdController,
  updateFoodServingController,
};
