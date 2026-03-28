/**
 * @typedef {"up" | "down" | "left" | "right"} Action
 * @typedef {"empty" | "agent" | "obstacle" | "reward"} CellType
 *
 * @typedef {{ row: number, col: number }} Position
 *
 * @typedef {{
 *   rows?: number,
 *   cols?: number,
 *   startPosition?: Position,
 *   obstacles?: Position[],
 *   rewards?: Position[],
 *   obstacleCount?: number,
 *   rewardCount?: number,
 *   maxSteps?: number,
 *   seed?: number
 * }} InitializeGameOptions
 *
 * @typedef {{
 *   rows: number,
 *   cols: number,
 *   cells: CellType[][],
 *   agentPosition: Position,
 *   obstacles: Position[],
 *   rewards: Position[],
 *   collectedRewards: number,
 *   score: number,
 *   steps: number,
 *   maxSteps: number,
 *   status: "running" | "won" | "lost"
 * }} GameState
 *
 * @typedef {{
 *   state: GameState,
 *   reward: number,
 *   done: boolean
 * }} StepResult
 *
 * @typedef {{
 *   grid: number[][],
 *   agent: { x: number, y: number },
 *   score: number,
 *   steps: number,
 *   rewardsCollected: number,
 *   status: "idle" | "running" | "done"
 * }} GameResponse
 */

export const ACTIONS = ["up", "down", "left", "right"];

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_SEED = 13;
const MOVE_PENALTY = -1;
const INVALID_MOVE_PENALTY = -5;
const REWARD_PICKUP_BONUS = 10;
const WIN_BONUS = 25;
const LOSS_PENALTY = -10;

/**
 * Creates a deterministic grid environment with agent, obstacles, and rewards.
 *
 * @param {InitializeGameOptions} [options={}]
 * @returns {GameState}
 */
export function initializeGame(options = {}) {
  const rows = normalizeSize(options.rows, DEFAULT_ROWS);
  const cols = normalizeSize(options.cols, DEFAULT_COLS);
  const seed = Number.isInteger(options.seed) ? options.seed : DEFAULT_SEED;
  const startPosition = clampPosition(options.startPosition ?? { row: rows - 1, col: 0 }, rows, cols);
  const maxPlacements = rows * cols - 1;
  const obstacleCount = clampCount(options.obstacleCount ?? Math.floor((rows * cols) * 0.16), maxPlacements);
  const rewardCount = clampCount(options.rewardCount ?? Math.floor((rows * cols) * 0.1), maxPlacements);
  const maxSteps = normalizeSize(options.maxSteps, rows * cols * 2);

  const occupied = new Set([positionKey(startPosition)]);

  const obstacles = options.obstacles
    ? normalizePositions(options.obstacles, rows, cols, occupied)
    : generatePositions({
        rows,
        cols,
        count: obstacleCount,
        occupied,
        seed: seed * 3 + 7
      });

  const rewards = options.rewards
    ? normalizePositions(options.rewards, rows, cols, occupied)
    : generatePositions({
        rows,
        cols,
        count: rewardCount,
        occupied,
        seed: seed * 5 + 11
      });

  return {
    rows,
    cols,
    cells: buildGrid({ rows, cols, agentPosition: startPosition, obstacles, rewards }),
    agentPosition: startPosition,
    obstacles,
    rewards,
    collectedRewards: 0,
    score: 0,
    steps: 0,
    maxSteps,
    status: "running"
  };
}

/**
 * Applies a single action and returns the next immutable environment state.
 *
 * @param {GameState} state
 * @param {Action} action
 * @returns {StepResult}
 */
export function moveAgent(state, action) {
  assertValidAction(action);

  if (checkGameOver(state)) {
    return {
      state,
      reward: 0,
      done: true
    };
  }

  const nextPosition = applyAction(state.agentPosition, action);
  const blocked = !isInsideGrid(nextPosition, state.rows, state.cols) || containsPosition(state.obstacles, nextPosition);
  const effectivePosition = blocked ? state.agentPosition : nextPosition;
  const collectedReward = !blocked && containsPosition(state.rewards, effectivePosition);
  const remainingRewards = collectedReward
    ? state.rewards.filter((rewardPosition) => !samePosition(rewardPosition, effectivePosition))
    : state.rewards;

  const draftState = {
    ...state,
    agentPosition: effectivePosition,
    rewards: remainingRewards,
    collectedRewards: collectedReward ? state.collectedRewards + 1 : state.collectedRewards,
    steps: state.steps + 1
  };

  const reward = calculateReward(state, draftState);
  const scoredState = {
    ...draftState,
    score: state.score + reward
  };
  const done = checkGameOver(scoredState);
  const finalState = {
    ...scoredState,
    status: resolveStatus(scoredState, done),
    cells: buildGrid({
      rows: scoredState.rows,
      cols: scoredState.cols,
      agentPosition: scoredState.agentPosition,
      obstacles: scoredState.obstacles,
      rewards: scoredState.rewards
    })
  };

  return {
    state: finalState,
    reward,
    done
  };
}

/**
 * Scores a transition based on movement validity, reward pickup, and terminal state.
 *
 * @param {GameState} previousState
 * @param {GameState} nextState
 * @returns {number}
 */
export function calculateReward(previousState, nextState) {
  const invalidMove = samePosition(previousState.agentPosition, nextState.agentPosition);
  const collectedReward = nextState.rewards.length < previousState.rewards.length;
  const done = checkGameOver(nextState);
  const won = done && nextState.rewards.length === 0;
  const lost = done && nextState.steps >= nextState.maxSteps && nextState.rewards.length > 0;

  let reward = invalidMove ? INVALID_MOVE_PENALTY : MOVE_PENALTY;

  if (collectedReward) {
    reward += REWARD_PICKUP_BONUS;
  }

  if (won) {
    reward += WIN_BONUS;
  }

  if (lost) {
    reward += LOSS_PENALTY;
  }

  return reward;
}

/**
 * Ends the game when the agent collects all rewards or runs out of steps.
 *
 * @param {GameState} state
 * @returns {boolean}
 */
export function checkGameOver(state) {
  return state.rewards.length === 0 || state.steps >= state.maxSteps;
}

/**
 * Builds the lightweight response shape used by the Simulation Arena API.
 *
 * @param {GameState} state
 * @param {number} [reward=0]
 * @returns {GameResponse}
 */
export function createGameResponse(state, reward = 0) {
  return {
    grid: serializeGrid(state.cells),
    agent: {
      x: state.agentPosition.col,
      y: state.agentPosition.row
    },
    score: state.score,
    steps: state.steps,
    rewardsCollected: state.collectedRewards,
    status: checkGameOver(state) ? "done" : "running"
  };
}

/**
 * @returns {GameResponse}
 */
export function createIdleGameResponse() {
  const state = initializeGame({
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    obstacleCount: 0,
    rewardCount: 0,
    maxSteps: DEFAULT_ROWS * DEFAULT_COLS * 2
  });

  return {
    ...createGameResponse({
      ...state,
      status: "running"
    }),
    score: 0,
    steps: 0,
    rewardsCollected: 0,
    status: "idle"
  };
}

/**
 * @param {Position} position
 * @param {Action} action
 * @returns {Position}
 */
function applyAction(position, action) {
  switch (action) {
    case "up":
      return { row: position.row - 1, col: position.col };
    case "down":
      return { row: position.row + 1, col: position.col };
    case "left":
      return { row: position.row, col: position.col - 1 };
    case "right":
      return { row: position.row, col: position.col + 1 };
    default:
      return position;
  }
}

/**
 * @param {Action} action
 * @returns {void}
 */
function assertValidAction(action) {
  if (!ACTIONS.includes(action)) {
    throw new Error(`Invalid action "${action}". Expected one of: ${ACTIONS.join(", ")}.`);
  }
}

/**
 * @param {{
 *   rows: number,
 *   cols: number,
 *   count: number,
 *   occupied: Set<string>,
 *   seed: number
 * }} options
 * @returns {Position[]}
 */
function generatePositions({ rows, cols, count, occupied, seed }) {
  const random = createSeededRandom(seed);
  const positions = [];
  const targetCount = Math.min(count, rows * cols - occupied.size);
  let attempts = 0;
  const maxAttempts = rows * cols * 20;

  while (positions.length < targetCount && attempts < maxAttempts) {
    attempts += 1;
    const position = {
      row: Math.floor(random() * rows),
      col: Math.floor(random() * cols)
    };
    const key = positionKey(position);

    if (occupied.has(key)) {
      continue;
    }

    occupied.add(key);
    positions.push(position);
  }

  return positions;
}

/**
 * @param {Position[] | undefined} positions
 * @param {number} rows
 * @param {number} cols
 * @param {Set<string>} occupied
 * @returns {Position[]}
 */
function normalizePositions(positions, rows, cols, occupied) {
  if (!positions) {
    return [];
  }

  const unique = [];

  for (const position of positions) {
    const normalized = clampPosition(position, rows, cols);
    const key = positionKey(normalized);

    if (occupied.has(key)) {
      continue;
    }

    occupied.add(key);
    unique.push(normalized);
  }

  return unique;
}

/**
 * @param {{
 *   rows: number,
 *   cols: number,
 *   agentPosition: Position,
 *   obstacles: Position[],
 *   rewards: Position[]
 * }} options
 * @returns {CellType[][]}
 */
function buildGrid({ rows, cols, agentPosition, obstacles, rewards }) {
  const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "empty"));

  for (const obstacle of obstacles) {
    cells[obstacle.row][obstacle.col] = "obstacle";
  }

  for (const reward of rewards) {
    cells[reward.row][reward.col] = "reward";
  }

  cells[agentPosition.row][agentPosition.col] = "agent";

  return cells;
}

/**
 * @param {GameState} state
 * @param {boolean} done
 * @returns {"running" | "won" | "lost"}
 */
function resolveStatus(state, done) {
  if (!done) {
    return "running";
  }

  return state.rewards.length === 0 ? "won" : "lost";
}

/**
 * @param {Position} position
 * @param {number} rows
 * @param {number} cols
 * @returns {Position}
 */
function clampPosition(position, rows, cols) {
  return {
    row: Math.min(Math.max(position.row, 0), rows - 1),
    col: Math.min(Math.max(position.col, 0), cols - 1)
  };
}

/**
 * @param {Position} position
 * @param {number} rows
 * @param {number} cols
 * @returns {boolean}
 */
function isInsideGrid(position, rows, cols) {
  return position.row >= 0 && position.row < rows && position.col >= 0 && position.col < cols;
}

/**
 * @param {Position[]} positions
 * @param {Position} target
 * @returns {boolean}
 */
function containsPosition(positions, target) {
  return positions.some((position) => samePosition(position, target));
}

/**
 * @param {Position} left
 * @param {Position} right
 * @returns {boolean}
 */
function samePosition(left, right) {
  return left.row === right.row && left.col === right.col;
}

/**
 * @param {Position} position
 * @returns {string}
 */
function positionKey(position) {
  return `${position.row}:${position.col}`;
}

/**
 * @param {number | undefined} value
 * @param {number} fallback
 * @returns {number}
 */
function normalizeSize(value, fallback) {
  if (!Number.isInteger(value) || value <= 0) {
    return fallback;
  }

  return value;
}

/**
 * @param {number} value
 * @param {number} max
 * @returns {number}
 */
function clampCount(value, max) {
  if (!Number.isInteger(value) || value < 0) {
    return 0;
  }

  return Math.min(value, max);
}

/**
 * Deterministic pseudo-random generator so initialization stays repeatable for the same seed.
 *
 * @param {number} seed
 * @returns {() => number}
 */
function createSeededRandom(seed) {
  let current = seed >>> 0;

  return () => {
    current = (1664525 * current + 1013904223) >>> 0;
    return current / 4294967296;
  };
}

/**
 * @param {CellType[][]} cells
 * @returns {number[][]}
 */
function serializeGrid(cells) {
  return cells.map((row) =>
    row.map((cell) => {
      switch (cell) {
        case "agent":
          return 1;
        case "obstacle":
          return 2;
        case "reward":
          return 3;
        default:
          return 0;
      }
    })
  );
}
