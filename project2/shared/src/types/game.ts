export type GameStatus = "active" | "won" | "lost";

export interface GameState {
  attemptsRemaining: number;
  guessHistory: number[];
  lowerBound: number;
  upperBound: number;
  status: GameStatus;
}

export interface GameSession {
  sessionId: string;
  state: GameState;
}

export interface GuessRequest {
  guess: number;
}

export interface GuessResult {
  message: string;
  sessionId: string;
  state: GameState;
}

