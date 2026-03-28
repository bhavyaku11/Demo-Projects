export type CellType = "empty" | "obstacle" | "reward";

export interface GridCell {
  col: number;
  row: number;
  type: CellType;
  visits: number;
}

export interface Position {
  col: number;
  row: number;
}

export interface SimulationState {
  agent: Position;
  cells: GridCell[][];
  gridSize: number;
  isRunning: boolean;
  message: string;
  rewardsRemaining: number;
  score: number;
  steps: number;
  totalRewards: number;
}

const DIRECTIONS: Position[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 }
];

export function createSimulationState(gridSize: number): SimulationState {
  const start = { row: gridSize - 1, col: 0 };
  const obstacleCount = Math.max(10, Math.floor(gridSize * gridSize * 0.14));
  const rewardCount = Math.max(6, Math.floor(gridSize * gridSize * 0.12));

  const cells = Array.from({ length: gridSize }, (_, row) =>
    Array.from({ length: gridSize }, (_, col) => ({
      row,
      col,
      type: "empty" as CellType,
      visits: row === start.row && col === start.col ? 1 : 0
    }))
  );

  const protectedCells = new Set<string>([
    key(start),
    key({ row: start.row - 1, col: start.col }),
    key({ row: start.row, col: start.col + 1 }),
    key({ row: start.row - 1, col: start.col + 1 })
  ]);

  scatterCells(cells, obstacleCount, protectedCells, "obstacle");
  scatterCells(cells, rewardCount, protectedCells, "reward");

  return {
    agent: start,
    cells,
    gridSize,
    isRunning: false,
    message: "Simulation primed. Start the arena to collect rewards.",
    rewardsRemaining: countCells(cells, "reward"),
    score: 0,
    steps: 0,
    totalRewards: countCells(cells, "reward")
  };
}

export function advanceSimulation(state: SimulationState): SimulationState {
  const nextPosition = pickNextPosition(state);

  if (!nextPosition) {
    return {
      ...state,
      isRunning: false,
      message: "Agent is boxed in by obstacles. Reset to generate a new field."
    };
  }

  const cells = state.cells.map((row) => row.map((cell) => ({ ...cell })));
  const nextCell = cells[nextPosition.row]?.[nextPosition.col];

  if (!nextCell) {
    return state;
  }

  const rewardCollected = nextCell.type === "reward";
  nextCell.visits += 1;
  nextCell.type = "empty";

  const rewardsRemaining = state.rewardsRemaining - (rewardCollected ? 1 : 0);
  const score = state.score + (rewardCollected ? 12 : 1);
  const steps = state.steps + 1;
  const limitReached = steps >= state.gridSize * state.gridSize * 3;
  const completed = rewardsRemaining === 0;
  const shouldStop = completed || limitReached;

  return {
    ...state,
    agent: nextPosition,
    cells,
    isRunning: shouldStop ? false : state.isRunning,
    message: resolveMessage({
      completed,
      limitReached,
      rewardCollected,
      rewardsRemaining
    }),
    rewardsRemaining,
    score,
    steps
  };
}

function resolveMessage(input: {
  completed: boolean;
  limitReached: boolean;
  rewardCollected: boolean;
  rewardsRemaining: number;
}) {
  if (input.completed) {
    return "All rewards secured. Arena run completed successfully.";
  }

  if (input.limitReached) {
    return "Run budget reached. Reset to spin a new map and continue testing.";
  }

  if (input.rewardCollected) {
    return `${input.rewardsRemaining} reward nodes left. Agent routed to the next target.`;
  }

  return "Agent advancing across the grid.";
}

function pickNextPosition(state: SimulationState): Position | null {
  const neighbors = DIRECTIONS.map((direction) => ({
    row: state.agent.row + direction.row,
    col: state.agent.col + direction.col
  })).filter((position) => isWalkable(state.cells, position, state.gridSize));

  if (neighbors.length === 0) {
    return null;
  }

  const rewardNeighbor = neighbors.find((position) => cellAt(state.cells, position)?.type === "reward");

  if (rewardNeighbor) {
    return rewardNeighbor;
  }

  const rewardTargets = collectTargets(state.cells, "reward");

  return (
    neighbors
    .slice()
    .sort((left, right) => scorePosition(left, state.cells, rewardTargets) - scorePosition(right, state.cells, rewardTargets))[0] ?? null
  );
}

function scorePosition(position: Position, cells: GridCell[][], rewards: Position[]): number {
  const cell = cellAt(cells, position);
  const nearestRewardDistance = rewards.length
    ? Math.min(...rewards.map((reward) => manhattanDistance(position, reward)))
    : 0;

  return nearestRewardDistance * 4 + (cell?.visits ?? 0) * 3 + randomNoise();
}

function collectTargets(cells: GridCell[][], type: CellType): Position[] {
  const targets: Position[] = [];

  for (const row of cells) {
    for (const cell of row) {
      if (cell.type === type) {
        targets.push({ row: cell.row, col: cell.col });
      }
    }
  }

  return targets;
}

function scatterCells(
  cells: GridCell[][],
  count: number,
  protectedCells: Set<string>,
  type: Extract<CellType, "obstacle" | "reward">
) {
  let placed = 0;
  let attempts = 0;
  const maxAttempts = count * 20;

  while (placed < count && attempts < maxAttempts) {
    attempts += 1;

    const row = randomInt(0, cells.length - 1);
    const col = randomInt(0, cells.length - 1);
    const candidate = cells[row]?.[col];

    if (!candidate || candidate.type !== "empty" || protectedCells.has(key(candidate))) {
      continue;
    }

    candidate.type = type;
    placed += 1;
  }
}

function isWalkable(cells: GridCell[][], position: Position, gridSize: number) {
  const withinBounds =
    position.row >= 0 &&
    position.row < gridSize &&
    position.col >= 0 &&
    position.col < gridSize;

  if (!withinBounds) {
    return false;
  }

  return cellAt(cells, position)?.type !== "obstacle";
}

function countCells(cells: GridCell[][], type: CellType) {
  return cells.flat().filter((cell) => cell.type === type).length;
}

function cellAt(cells: GridCell[][], position: Position) {
  return cells[position.row]?.[position.col] ?? null;
}

function manhattanDistance(from: Position, to: Position) {
  return Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
}

function key(position: Position) {
  return `${position.row}:${position.col}`;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNoise() {
  return Math.random() * 0.8;
}
