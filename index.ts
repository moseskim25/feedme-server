import Fastify from "fastify";
import "dotenv/config";

// Routes
import { getLogs, postLog } from "./routes/log";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import { transcribeAudio } from "./routes/transcribe";

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

fastify.register(postLog);
fastify.register(getLogs);
fastify.register(transcribeAudio)

fastify.listen({ port: 3001 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
