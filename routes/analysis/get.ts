import { pool } from "@/lib/db";
import { FastifyInstance } from "fastify";

export async function getAnalysis(fastify: FastifyInstance) {
  fastify.get("/analysis", async (request, reply) => {
    try {
      const query = `
        SELECT DISTINCT ON (logical_date) * 
        FROM analysis
        ORDER BY logical_date DESC, created_at DESC;
      `;

      const result = await pool.query(query);

      return reply.status(200).send(result.rows);
    } catch (err) {
      console.error("Query error:", err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
