import { pool } from "@/lib/db";
import { Router } from "express";

export const feedbackRouter = Router();

feedbackRouter.get("/feedback", async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (logical_date) * 
      FROM feedback
      ORDER BY logical_date DESC, created_at DESC;
    `;

    const result = await pool.query(query);

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Query error:", err);
  }
});
