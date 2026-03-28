import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { createIdleGameResponse } from "../services/gameEngine.js";

export function notFoundHandler(request: Request, response: Response): void {
  response.status(404).json({
    message: "Route not found.",
    ...(isArenaRequest(request) ? { data: createIdleGameResponse() } : {})
  });
}

export function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction
): void {
  if (response.headersSent) {
    return;
  }

  const requestId = request.requestId ?? "unknown";

  if (error instanceof ZodError) {
    console.warn(`[${requestId}] validation error`, error.flatten());
    response.status(400).json({
      message: "Invalid request payload.",
      requestId,
      errors: error.flatten(),
      ...(isArenaRequest(request) ? { data: createIdleGameResponse() } : {})
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    console.warn(`[${requestId}] invalid json payload`);
    response.status(400).json({
      message: "Malformed JSON payload.",
      requestId,
      ...(isArenaRequest(request) ? { data: createIdleGameResponse() } : {})
    });
    return;
  }

  if (env.NODE_ENV !== "production") {
    console.error(`[${requestId}]`, error);
  } else {
    console.error(`[${requestId}] ${error.message}`);
  }

  response.status(500).json({
    message: "Internal server error.",
    requestId,
    ...(isArenaRequest(request) ? { data: createIdleGameResponse() } : {})
  });
}

function isArenaRequest(request: Request) {
  return request.originalUrl.includes("/game");
}
