import { Request, Response } from "express";
import { pool } from "@/lib/db";

const LIMIT = 2;

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

    const today = new Date().toISOString().split("T")[0];
    if (!dates.includes(today) && offset === 0) {
      dates.unshift(today);
    }

    const foodQuery = `
        SELECT
            *
        FROM food
        WHERE user_id = $1
        AND logical_date = ANY($2)
        AND deleted_at IS NULL
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

    for (const date of dates) {
      data[date] = {
        feedback: feedbackResult.rows.find((row) => row.logical_date === date)
          ?.content,
        food: foodResult.rows.filter((row) => row.logical_date === date),
        symptoms: symptomResult.rows.filter((row) => row.logical_date === date),
      };
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
