import Fastify from "fastify";
import "dotenv/config";

// Routes
import mealRoutes from "./routes/meal";
import logFood from "./routes/log-food";
import log from "./routes/log";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";

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

fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

fastify.register(mealRoutes);
fastify.register(logFood);
fastify.register(log);

fastify.listen({ port: 3001 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
