import "module-alias/register";
import { setupGracefulShutdown } from "./lib/db-shutdown";
import Fastify from "fastify";
import "dotenv/config";
import "tsconfig-paths/register";

// Routes
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import { transcribe } from "./routes/transcribe/index";
import { authMiddleware } from "./lib/auth";
import { processMessage } from "./routes/process-message";
import { getFeedback } from "./routes/feedback";

// Custom type declaration for request
declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

// const fastify = Fastify({
//   logger: true
// })

const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    },
  },
});

fastify.register(fastifyMultipart);

fastify.register(fastifyCors, {
  origin: true,
});

// Middleware
fastify.addHook("preHandler", authMiddleware());

// Transcribe
fastify.register(transcribe);

// Process Message
fastify.register(processMessage);

fastify.register(getFeedback);

const PORT = Number(process.env.PORT) || 3001;

fastify.listen({ port: PORT, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});

setupGracefulShutdown(fastify);
