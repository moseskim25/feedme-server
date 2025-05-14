import { pool } from "@/lib/db";
import { FastifyInstance } from "fastify";

export async function getAnalysisStatus(fastify: FastifyInstance) {
  fastify.get("/analysis/status", async (request, reply) => {
    try {
      const userId = request.userId;

      const query = `SELECT EXISTS (
                        SELECT 1 FROM message WHERE user_id = $1 AND is_processed = false
                    ) AS is_pending_analysis;`;

      const result = await pool.query(query, [userId]);

      const isPendingAnalysis = result.rows[0].is_pending_analysis;

      return reply.status(200).send({ isPendingAnalysis });
    } catch (err) {
      console.error("Query error:", err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
