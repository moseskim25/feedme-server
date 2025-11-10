import "module-alias/register";
import * as Sentry from "@sentry/node";
import { expressIntegration, expressErrorHandler } from "@sentry/node";
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
  messageRouter,
  messageCountRouter,
  foodRouter,
  foodGroupRouter,
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

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  integrations: [expressIntegration()],
});

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
app.use(messageRouter);
app.use(messageCountRouter);
app.use(foodRouter);
app.use(foodGroupRouter);
app.use(userRouter);
app.use(userJobRouter);
app.use(transcribeRouter);

// Sentry error handler must be before other error middleware and after all controllers
app.use(expressErrorHandler());

// Optional fallthrough error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err, "Unhandled error");
  
  const errorId = Sentry.lastEventId();
  
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { message: err.message }),
    ...(errorId && { errorId }),
  });
});

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server listening on port ${PORT}`);
});

setupGracefulShutdown(server, logger);
