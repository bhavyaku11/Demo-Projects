import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { createIdleGameResponse } from "../services/gameEngine.js";
import {
  getEnvironmentScore,
  getEnvironmentState,
  startEnvironmentGame,
  stepEnvironmentGame
} from "../services/environment.service.js";

const startSchema = z
  .object({
    rows: z.coerce.number().int().min(4).max(30).optional(),
    cols: z.coerce.number().int().min(4).max(30).optional(),
    obstacleCount: z.coerce.number().int().min(0).optional(),
    rewardCount: z.coerce.number().int().min(0).optional(),
    maxSteps: z.coerce.number().int().min(1).optional(),
    seed: z.coerce.number().int().optional()
  })
  .partial();

const directionSchema = z.enum(["up", "down", "left", "right"]);

const moveSchema = z.object({
  direction: directionSchema
});

export function startEnvironmentController(request: Request, response: Response, next: NextFunction): void {
  try {
    console.log(`Received POST /game/start request with body:`, request.body);
    const parsed = startSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      sendArenaError(response, 400, "Invalid game configuration.", parsed.error.flatten());
      return;
    }

    const result = startEnvironmentGame(parsed.data);

    response.status(201).json({
      message: "Game initialized successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export function moveEnvironmentController(request: Request, response: Response, next: NextFunction): void {
  try {
    console.log(`Received POST /game/move request with body:`, request.body);
    const parsed = moveSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      sendArenaError(response, 400, "Direction must be one of: up, down, left, right.", parsed.error.flatten());
      return;
    }

    const result = stepEnvironmentGame(parsed.data.direction);

    response.status(200).json({
      message: result.status === "done" ? "Move applied. Game complete." : "Move applied successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export const stepEnvironmentController = moveEnvironmentController;

export function environmentStateController(_request: Request, response: Response, next: NextFunction): void {
  try {
    const result = getEnvironmentState();

    response.status(200).json({
      message: result.status === "idle" ? "Arena is idle." : "Current game state retrieved successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export function environmentScoreController(_request: Request, response: Response, next: NextFunction): void {
  try {
    const result = getEnvironmentScore();

    response.status(200).json({
      message: result.status === "idle" ? "Arena is idle." : "Current game state retrieved successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

function sendArenaError(
  response: Response,
  status: number,
  message: string,
  errors?: Record<string, unknown>
) {
  response.status(status).json({
    message,
    data: createIdleGameResponse(),
    ...(errors ? { errors } : {})
  });
}
