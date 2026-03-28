import {
  createIdleGameResponse,
  createGameResponse,
  initializeGame,
  moveAgent,
  type Action,
  type InitializeGameOptions
} from "./gameEngine.js";

type EnvironmentArenaResponse = ReturnType<typeof createGameResponse>;

let currentGameState: ReturnType<typeof initializeGame> | null = null;

export function startEnvironmentGame(options: InitializeGameOptions = {}): EnvironmentArenaResponse {
  currentGameState = initializeGame({
    ...options,
    cols: 10,
    rows: 10
  });

  return createGameResponse(currentGameState);
}

export function stepEnvironmentGame(action: Action): EnvironmentArenaResponse {
  if (!currentGameState) {
    return createIdleGameResponse();
  }

  const result = moveAgent(currentGameState, action);
  currentGameState = result.state;

  return createGameResponse(result.state, result.reward);
}

export function getEnvironmentState(): EnvironmentArenaResponse {
  if (!currentGameState) {
    return createIdleGameResponse();
  }

  return createGameResponse(currentGameState);
}

export function getEnvironmentScore(): EnvironmentArenaResponse {
  if (!currentGameState) {
    return createIdleGameResponse();
  }

  return createGameResponse(currentGameState);
}
