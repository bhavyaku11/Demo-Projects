import { useState } from "react";

import type { GameState } from "@scalar/shared";

import { startGame, submitGuess } from "../api/gameApi";

export function useGame() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [message, setMessage] = useState("Start a game to generate a new hidden number.");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const startNewGame = async () => {
    try {
      setIsPending(true);
      setError(null);
      const session = await startGame();
      setSessionId(session.sessionId);
      setState(session.state);
      setMessage("New game created. Guess a number between 1 and 100.");
    } catch (caughtError) {
      setError(toErrorMessage(caughtError));
    } finally {
      setIsPending(false);
    }
  };

  const makeGuess = async (guess: number) => {
    if (!sessionId) {
      setError("Start a new game before submitting a guess.");
      return;
    }

    try {
      setIsPending(true);
      setError(null);
      const result = await submitGuess(sessionId, { guess });
      setState(result.state);
      setMessage(result.message);
    } catch (caughtError) {
      setError(toErrorMessage(caughtError));
    } finally {
      setIsPending(false);
    }
  };

  return {
    error,
    isPending,
    message,
    sessionId,
    state,
    makeGuess,
    startNewGame
  };
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Request failed.";
}
