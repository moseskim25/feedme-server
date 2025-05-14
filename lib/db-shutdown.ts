import { pool } from "./db";
import { FastifyInstance } from "fastify";

export function setupGracefulShutdown(fastify: FastifyInstance) {
  const shutdown = async () => {
    console.log("Gracefully shutting down...");

    try {
      await fastify.close(); // Stop accepting new requests
      await pool.end(); // Close DB pool connections
      console.log("Server and DB pool closed.");
    } catch (err) {
      console.error("Error during shutdown:", err);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
