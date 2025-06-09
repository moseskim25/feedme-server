import { Request, Response } from "express";
import { pool } from "@/lib/db";

export const getFeedbackForUserForDate = async (
  req: Request,
  res: Response
) => {
  try {
    const logicalDate = req.query.date;
    const userId = req.userId;

    if (!logicalDate) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: date" });
    }

    const query = `
      SELECT 
        DISTINCT ON (logical_date) * 
      FROM feedback
      WHERE logical_date = $1 AND user_id = $2
      ORDER BY logical_date DESC, created_at DESC;
    `;

    const result = await pool.query(query, [logicalDate, userId]);

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Query error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
