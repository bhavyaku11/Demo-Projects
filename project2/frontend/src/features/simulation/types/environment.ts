export type Action = "up" | "down" | "left" | "right";
export type CellType = "empty" | "agent" | "obstacle" | "reward";
export type GameStatus = "idle" | "running" | "done";

export interface Position {
  row: number;
  col: number;
}

export interface AgentCoordinate {
  x: number;
  y: number;
}

export interface EnvironmentState {
  rows: number;
  cols: number;
  cells: CellType[][];
  agentPosition: Position;
  obstacles: Position[];
  rewards: Position[];
  collectedRewards: number;
  score: number;
  steps: number;
  maxSteps: number;
  status: GameStatus;
}

export interface EnvironmentScore {
  totalScore: number;
  breakdown: {
    survival: number;
    efficiency: number;
    completion: number;
  };
}

export interface ArenaGameStateResponse {
  grid: number[][];
  agent: AgentCoordinate;
  score: number;
  steps: number;
  rewardsCollected: number;
  status: GameStatus;
}

export interface ApiEnvelope<T> {
  message: string;
  data: T;
}
