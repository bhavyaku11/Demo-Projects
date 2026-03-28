import { useEffect, useMemo, useRef, useState } from "react";

import {
  getEnvironmentState,
  startEnvironment,
  stepEnvironment
} from "../api/environmentApi";
import type {
  Action,
  ArenaGameStateResponse,
  CellType,
  EnvironmentScore,
  EnvironmentState,
  GameStatus,
  Position
} from "../types/environment";

const DEFAULT_GRID_SIZE = 10;
const MOVE_PENALTY = -1;
const INVALID_MOVE_PENALTY = -5;
const REWARD_PICKUP_BONUS = 10;
const WIN_BONUS = 25;
const LOSS_PENALTY = -10;

export function useGame() {
  const [gameState, setGameState] = useState<ArenaGameStateResponse>(createIdleArenaState());
  const [message, setMessage] = useState("Start a game to initialize the backend environment.");
  const [error, setError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const isMountedRef = useRef(true);
  const moveInFlightRef = useRef(false);
  const startInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const hydrate = async () => {
      try {
        const stateResponse = await getEnvironmentState();

        if (isCancelled || !isMountedRef.current) {
          return;
        }

        setGameState(normalizeArenaState(stateResponse.data));
        setMessage(stateResponse.message);
        setError(null);
      } catch (caughtError) {
        if (isCancelled || !isMountedRef.current) {
          return;
        }

        setGameState(createIdleArenaState());
        setError(toErrorMessage(caughtError));
      } finally {
        if (!isCancelled && isMountedRef.current) {
          setIsBootstrapping(false);
        }
      }
    };

    void hydrate();

    return () => {
      isCancelled = true;
    };
  }, []);

  const gridSize = gameState.grid.length || DEFAULT_GRID_SIZE;
  const grid = useMemo(() => gameState.grid, [gameState.grid]);
  const agentPosition = useMemo<Position>(
    () => ({
      row: gameState.agent.y,
      col: gameState.agent.x
    }),
    [gameState.agent.x, gameState.agent.y]
  );
  const cells = useMemo(() => deserializeGrid(gameState.grid), [gameState.grid]);
  const obstacles = useMemo(() => collectPositions(cells, "obstacle"), [cells]);
  const rewards = useMemo(() => collectPositions(cells, "reward"), [cells]);
  const rewardsCollected = gameState.rewardsCollected;
  const score = gameState.score;
  const steps = gameState.steps;
  const gameStatus = gameState.status;
  const maxSteps = gridSize * gridSize * 2;

  const simulation = useMemo<EnvironmentState | null>(() => {
    if (gameState.status === "idle") {
      return null;
    }

    return {
      rows: gridSize,
      cols: gridSize,
      cells,
      agentPosition,
      obstacles,
      rewards,
      collectedRewards: rewardsCollected,
      score,
      steps,
      maxSteps,
      status: gameStatus
    };
  }, [agentPosition, cells, gameState.status, gameStatus, gridSize, maxSteps, obstacles, rewards, rewardsCollected, score, steps]);

  const evaluation = useMemo<EnvironmentScore>(
    () => ({
      totalScore: score,
      breakdown: {
        completion: gameStatus === "done" && rewards.length === 0 ? 1 : 0,
        efficiency: steps === 0 ? 0 : score / steps,
        survival: gameStatus === "done" && rewards.length > 0 ? 0 : 1
      }
    }),
    [gameStatus, rewards.length, score, steps]
  );

  const startGame = async (nextGridSize = gridSize) => {
    if (startInFlightRef.current) {
      return;
    }

    startInFlightRef.current = true;

    try {
      setIsStarting(true);
      setError(null);

      const response = await startEnvironment(buildStartOptions(nextGridSize));

      if (!isMountedRef.current) {
        return;
      }

      setGameState(normalizeArenaState(response.data));
      setMessage(response.message);
    } catch (caughtError) {
      if (isMountedRef.current) {
        console.error("API call failed (/game/start):", caughtError);
        setError(toErrorMessage(caughtError));
      }
    } finally {
      startInFlightRef.current = false;

      if (isMountedRef.current) {
        setIsStarting(false);
        setIsBootstrapping(false);
      }
    }
  };

  const moveAgent = async (direction: Action) => {
    if (gameState.status !== "running" || moveInFlightRef.current) {
      return;
    }

    moveInFlightRef.current = true;
    const previousState = gameState;
    const previousMessage = message;

    try {
      setIsMoving(true);
      setError(null);
      setGameState(applyOptimisticMove(gameState, direction));

      const response = await stepEnvironment(direction);

      if (!isMountedRef.current) {
        return;
      }

      setGameState(normalizeArenaState(response.data));
      setMessage(response.message);
    } catch (caughtError) {
      if (!isMountedRef.current) {
        return;
      }

      console.error("API call failed (/game/move):", caughtError);
      setGameState(previousState);
      setMessage(previousMessage);
      setError(toErrorMessage(caughtError));
    } finally {
      moveInFlightRef.current = false;

      if (isMountedRef.current) {
        setIsMoving(false);
      }
    }
  };

  const resetGame = async (nextGridSize = gridSize) => {
    await startGame(nextGridSize);
  };

  return {
    arenaState: gameState,
    agentPosition,
    error,
    evaluation,
    gameStatus,
    grid,
    gridSize,
    isBootstrapping,
    isMoving,
    isStarting,
    maxSteps,
    message,
    moveAgent,
    resetGame,
    rewards,
    rewardsCollected,
    score,
    setGridSize: () => undefined,
    simulation,
    startGame,
    steps
  };
}

function normalizeArenaState(input: ArenaGameStateResponse): ArenaGameStateResponse {
  const grid = input.grid.map((row) =>
    row.map((value) => {
      if (value === 1 || value === 2 || value === 3) {
        return value;
      }

      return 0;
    })
  );
  const normalizedGrid = (grid.length ? grid : createEmptyGrid()).map((row) =>
    row.map((value) => (value === 1 ? 0 : value))
  );
  const agent = {
    x: clampToGrid(input.agent.x),
    y: clampToGrid(input.agent.y)
  };
  const agentRow = normalizedGrid[agent.y];

  if (agentRow) {
    agentRow[agent.x] = 1;
  }

  return {
    grid: normalizedGrid,
    agent,
    score: input.score,
    steps: input.steps,
    rewardsCollected: input.rewardsCollected,
    status: input.status
  };
}

function applyOptimisticMove(state: ArenaGameStateResponse, action: Action): ArenaGameStateResponse {
  const candidateAgent = getCandidateAgentPosition(state.agent, action);
  const outsideGrid =
    candidateAgent.x < 0 ||
    candidateAgent.x >= DEFAULT_GRID_SIZE ||
    candidateAgent.y < 0 ||
    candidateAgent.y >= DEFAULT_GRID_SIZE;
  const nextAgent = outsideGrid ? state.agent : candidateAgent;
  const row = state.grid[nextAgent.y];
  const nextCell = row?.[nextAgent.x];
  const blocked = outsideGrid || typeof nextCell !== "number" || nextCell === 2;
  const effectiveAgent = blocked ? state.agent : nextAgent;
  const collectedReward = !blocked && nextCell === 3;
  const nextGrid = state.grid.map((currentRow) => [...currentRow]);

  const previousRow = nextGrid[state.agent.y];
  if (previousRow) {
    previousRow[state.agent.x] = 0;
  }

  const effectiveRow = nextGrid[effectiveAgent.y];
  if (effectiveRow) {
    effectiveRow[effectiveAgent.x] = 1;
  }

  const steps = state.steps + 1;
  const rewardsRemaining = nextGrid.flat().filter((value) => value === 3).length;
  const done = rewardsRemaining === 0;
  const rewardDelta =
    (blocked ? INVALID_MOVE_PENALTY : MOVE_PENALTY) +
    (collectedReward ? REWARD_PICKUP_BONUS : 0) +
    (done ? WIN_BONUS : 0);

  return {
    grid: nextGrid,
    agent: effectiveAgent,
    score: state.score + rewardDelta,
    steps,
    rewardsCollected: state.rewardsCollected + (collectedReward ? 1 : 0),
    status: done ? "done" : state.status
  };
}

function deserializeGrid(grid: number[][]): CellType[][] {
  return grid.map((row) =>
    row.map((cell) => {
      switch (cell) {
        case 1:
          return "agent";
        case 2:
          return "obstacle";
        case 3:
          return "reward";
        default:
          return "empty";
      }
    })
  );
}

function collectPositions(cells: CellType[][], type: Extract<CellType, "obstacle" | "reward">): Position[] {
  const positions: Position[] = [];

  for (const [rowIndex, row] of cells.entries()) {
    for (const [colIndex, cell] of row.entries()) {
      if (cell === type) {
        positions.push({ row: rowIndex, col: colIndex });
      }
    }
  }

  return positions;
}

function createIdleArenaState(): ArenaGameStateResponse {
  return {
    grid: createEmptyGrid(),
    agent: { x: 0, y: DEFAULT_GRID_SIZE - 1 },
    score: 0,
    steps: 0,
    rewardsCollected: 0,
    status: "idle"
  };
}

function createEmptyGrid() {
  return Array.from({ length: DEFAULT_GRID_SIZE }, () => Array.from({ length: DEFAULT_GRID_SIZE }, () => 0));
}

function buildStartOptions(gridSize: number) {
  return {
    rows: gridSize,
    cols: gridSize,
    obstacleCount: Math.max(6, Math.floor(gridSize * gridSize * 0.14)),
    rewardCount: Math.max(4, Math.floor(gridSize * gridSize * 0.1)),
    maxSteps: gridSize * gridSize * 2
  };
}

function getCandidateAgentPosition(agent: ArenaGameStateResponse["agent"], action: Action) {
  switch (action) {
    case "up":
      return { x: agent.x, y: agent.y - 1 };
    case "down":
      return { x: agent.x, y: agent.y + 1 };
    case "left":
      return { x: agent.x - 1, y: agent.y };
    case "right":
      return { x: agent.x + 1, y: agent.y };
    default:
      return agent;
  }
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Simulation request failed.";
}

function clampToGrid(value: number) {
  return Math.min(Math.max(value, 0), DEFAULT_GRID_SIZE - 1);
}
