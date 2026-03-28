import { randomUUID } from "node:crypto";

import type { GameSession, GuessResult } from "@scalar/shared";

import {
  createInitialState,
  evaluateGuess,
  type StoredGameSession
} from "../game-logic/guess-game.engine.js";

const sessions = new Map<string, StoredGameSession>();

export function createGameSession(): GameSession {
  const sessionId = randomUUID();
  const session = createInitialState();

  sessions.set(sessionId, session);

  return {
    sessionId,
    state: session.state
  };
}

export function submitGuess(sessionId: string, guess: number): GuessResult | null {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  const result = evaluateGuess(sessionId, session, guess);
  sessions.set(sessionId, session);

  return result;
}
