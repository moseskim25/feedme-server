import { query, Request, Response } from "express";
import { pool } from "@/lib/db";

const LIMIT = 5;

const feedController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const offset = Number(req.query.offset);

    const feedbackQuery = `
      SELECT 
        DISTINCT ON (logical_date) * 
      FROM feedback
      WHERE user_id = $1
      ORDER BY logical_date DESC, created_at DESC
      LIMIT ${LIMIT}
      OFFSET $2;
    `;

    const feedbackResult = await pool.query(feedbackQuery, [userId, offset]);

    const dates = feedbackResult.rows.map((row) => row.logical_date);

    const foodQuery = `
        SELECT
            *
        FROM food
        WHERE user_id = $1
        AND logical_date = ANY($2)
        ORDER BY logical_date DESC;
    `;

    const foodResult = await pool.query(foodQuery, [userId, dates]);

    const symptomQuery = `
        SELECT
            *
        FROM symptom
        WHERE user_id = $1
        AND logical_date = ANY($2);
    `;

    const symptomResult = await pool.query(symptomQuery, [userId, dates]);

    const data: Record<
      string,
      { feedback?: any; food?: any[]; symptoms?: any[] }
    > = {};

    for (const feedback of feedbackResult.rows) {
      if (!data[feedback.logical_date]) {
        data[feedback.logical_date] = {};
      }

      data[feedback.logical_date].feedback = feedback.content;
      data[feedback.logical_date].food = [];
      data[feedback.logical_date].symptoms = [];
    }

    for (const food of foodResult.rows) {
      if (data[food.logical_date].food) {
        data[food.logical_date].food!.push(food);
      }
    }

    for (const symptom of symptomResult.rows) {
      if (data[symptom.logical_date].symptoms) {
        data[symptom.logical_date].symptoms!.push(symptom);
      }
    }

    const noMoreRows = feedbackResult.rows.length < LIMIT;
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
