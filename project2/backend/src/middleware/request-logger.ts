import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestLogger(request: Request, response: Response, next: NextFunction): void {
  const startedAt = Date.now();
  const requestId = randomUUID().slice(0, 8);

  request.requestId = requestId;
  response.setHeader("X-Request-Id", requestId);

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const summary = `[${requestId}] ${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms`;

    if (response.statusCode >= 500) {
      console.error(summary);
      return;
    }

    if (response.statusCode >= 400) {
      console.warn(summary);
      return;
    }

    console.info(summary);
  });

  next();
}

