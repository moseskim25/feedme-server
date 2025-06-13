import "module-alias/register";
import { setupGracefulShutdown } from "./lib/db-shutdown";
import express from "express";
import "dotenv/config";
import "tsconfig-paths/register";
import cors from "cors";
import multer from "multer";
import pino from "pino";

// Routes
import { authMiddleware } from "./src/middleware";
import {
  processMessageRouter,
  foodRouter,
  messageCountRouter,
  feedRouter,
  userRouter,
  userJobRouter,
  transcribeRouter,
} from "./src/routes";

// Custom type declaration for request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      authToken?: string;
    }
  }
}

const app = express();

// Setup logger
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname",
    },
  },
});

// Custom request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  logger.info(`${req.method} ${req.url}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.url} - Request completed [${res.statusCode}] in ${duration}ms`
    );
  });

  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: true,
  })
);

// Auth middleware
app.use(authMiddleware());

// Routes
app.use(processMessageRouter);
app.use(foodRouter);
app.use(messageCountRouter);
app.use(feedRouter);
app.use(userRouter);
app.use(userJobRouter);
app.use(transcribeRouter);

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server listening on port ${PORT}`);
});

setupGracefulShutdown(server, logger);
