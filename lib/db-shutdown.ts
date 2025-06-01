import { pool } from "./db";
import { Server } from "http";

export function setupGracefulShutdown(server: Server, logger?: any) {
  const shutdown = async () => {
    console.log("Gracefully shutting down...");

    try {
      server.close(() => {
        console.log("HTTP server closed.");
      });

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
