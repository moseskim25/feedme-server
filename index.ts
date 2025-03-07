import "module-alias/register";

import Fastify from "fastify";
import "dotenv/config";
import "tsconfig-paths/register";

// Routes
import { postMessage } from "./routes/message/index";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import { transcribeAudio } from "./routes/transcribe/index";

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
  origin: true, // or specify the allowed origins
});

fastify.register(postMessage);
fastify.register(transcribeAudio);

const PORT = Number(process.env.PORT) || 3001;

fastify.listen({ port: PORT, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
