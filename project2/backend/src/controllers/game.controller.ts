import type { Request, Response } from "express";
import { z } from "zod";

import { createGameSession, submitGuess } from "../services/game.service.js";

const guessSchema = z.object({
  guess: z.coerce.number().int().min(1).max(100)
});

const paramsSchema = z.object({
  sessionId: z.string().uuid()
});

export function startGameController(_request: Request, response: Response): void {
  response.status(201).json(createGameSession());
}

export function guessController(request: Request, response: Response): void {
  const parsedParams = paramsSchema.safeParse(request.params);

  if (!parsedParams.success) {
    response.status(400).json({ message: "Invalid session identifier." });
    return;
  }

  const parsedBody = guessSchema.safeParse(request.body);

  if (!parsedBody.success) {
    response.status(400).json({ message: "Guess must be an integer between 1 and 100." });
    return;
  }

  const result = submitGuess(parsedParams.data.sessionId, parsedBody.data.guess);

  if (!result) {
    response.status(404).json({ message: "Game session not found." });
    return;
  }

  response.status(200).json(result);
}
