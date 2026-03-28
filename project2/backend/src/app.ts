import cors from "cors";
import express from "express";
import helmet from "helmet";

import { API_PREFIX } from "@scalar/shared";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(requestLogger);
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_request, response) => {
    response.status(200).json({
      message: "Backend is running.",
      apiBasePath: API_PREFIX
    });
  });

  app.use(apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function resolveCorsOrigin(corsOrigin: string): true | string[] {
  if (corsOrigin === "*") {
    return true;
  }

  return corsOrigin
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
