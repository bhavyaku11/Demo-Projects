import type { GameState, GuessResult } from "@scalar/shared";

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 100;
const DEFAULT_ATTEMPTS = 8;

export interface StoredGameSession {
  targetNumber: number;
  state: GameState;
}

export function createInitialState(): StoredGameSession {
  return {
    targetNumber: randomNumber(DEFAULT_MIN, DEFAULT_MAX),
    state: {
      attemptsRemaining: DEFAULT_ATTEMPTS,
      guessHistory: [],
      lowerBound: DEFAULT_MIN,
      upperBound: DEFAULT_MAX,
      status: "active"
    }
  };
}

export function evaluateGuess(
  sessionId: string,
  currentSession: StoredGameSession,
  guess: number
): GuessResult {
  if (currentSession.state.status !== "active") {
    return {
      sessionId,
      message: "This game session is already complete. Start a new game to continue playing.",
      state: currentSession.state
    };
  }

  const nextHistory = [...currentSession.state.guessHistory, guess];
  const nextAttemptsRemaining = currentSession.state.attemptsRemaining - 1;

  if (guess === currentSession.targetNumber) {
    currentSession.state = {
      ...currentSession.state,
      guessHistory: nextHistory,
      attemptsRemaining: nextAttemptsRemaining,
      status: "won"
    };

    return {
      sessionId,
      message: "Correct guess. You found the hidden number.",
      state: currentSession.state
    };
  }

  const bounds =
    guess < currentSession.targetNumber
      ? {
          lowerBound: Math.max(currentSession.state.lowerBound, guess + 1),
          upperBound: currentSession.state.upperBound
        }
      : {
          lowerBound: currentSession.state.lowerBound,
          upperBound: Math.min(currentSession.state.upperBound, guess - 1)
        };

  const status = nextAttemptsRemaining === 0 ? "lost" : "active";

  currentSession.state = {
    ...currentSession.state,
    ...bounds,
    guessHistory: nextHistory,
    attemptsRemaining: nextAttemptsRemaining,
    status
  };

  const hint =
    guess < currentSession.targetNumber ? "Too low. Raise your next guess." : "Too high. Lower your next guess.";

  return {
    sessionId,
    message:
      status === "lost"
        ? `No attempts left. The hidden number was ${currentSession.targetNumber}.`
        : hint,
    state: currentSession.state
  };
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

