from __future__ import annotations

from random import Random
from uuid import uuid4

from openenv.core.env_server.interfaces import Environment

from scalar_grid_env.models import GridAction, GridObservation, GridPosition, GridState

ACTIONS = {
    "up": (-1, 0),
    "down": (1, 0),
    "left": (0, -1),
    "right": (0, 1),
}

DEFAULT_ROWS = 10
DEFAULT_COLS = 10
DEFAULT_MAX_STEPS_MULTIPLIER = 2
DEFAULT_OBSTACLE_DENSITY = 0.16
DEFAULT_REWARD_DENSITY = 0.10
MOVE_PENALTY = -1.0
INVALID_MOVE_PENALTY = -5.0
REWARD_BONUS = 10.0
WIN_BONUS = 25.0
LOSS_PENALTY = -10.0


class ScalarGridEnvironment(Environment[GridAction, GridObservation, GridState]):
    supports_concurrent_sessions = True

    def __init__(
        self,
        rows: int = DEFAULT_ROWS,
        cols: int = DEFAULT_COLS,
        obstacle_density: float = DEFAULT_OBSTACLE_DENSITY,
        reward_density: float = DEFAULT_REWARD_DENSITY,
        max_steps_multiplier: int = DEFAULT_MAX_STEPS_MULTIPLIER,
        seed: int | None = None,
    ) -> None:
        self._defaults = {
            "rows": max(rows, 4),
            "cols": max(cols, 4),
            "obstacle_density": max(min(obstacle_density, 0.35), 0.0),
            "reward_density": max(min(reward_density, 0.20), 0.0),
            "max_steps_multiplier": max(max_steps_multiplier, 1),
            "seed": seed,
        }
        self._state = self._build_initial_state(seed=seed)

    def reset(self, seed: int | None = None, episode_id: str | None = None, **kwargs) -> GridObservation:
        effective_seed = seed if seed is not None else kwargs.get("seed", self._defaults["seed"])
        self._state = self._build_initial_state(
            rows=kwargs.get("rows", self._defaults["rows"]),
            cols=kwargs.get("cols", self._defaults["cols"]),
            obstacle_count=kwargs.get("obstacle_count"),
            reward_count=kwargs.get("reward_count"),
            max_steps=kwargs.get("max_steps"),
            seed=effective_seed,
            episode_id=episode_id,
        )
        return self._to_observation("Environment reset. Agent ready to begin.", reward=0.0, done=False)

    def step(self, action: GridAction, timeout_s: float | None = None, **kwargs) -> GridObservation:
        del timeout_s, kwargs

        if self._state.status != "running":
            return self._to_observation(
                "Episode already complete. Call reset() to start a new run.",
                reward=0.0,
                done=True,
            )

        delta_row, delta_col = ACTIONS[action.action]
        current = self._state.agent_position
        candidate = GridPosition(row=current.row + delta_row, col=current.col + delta_col)

        blocked = (
            candidate.row < 0
            or candidate.row >= self._state.rows
            or candidate.col < 0
            or candidate.col >= self._state.cols
            or self._contains_position(self._state.obstacles, candidate)
        )

        next_position = current if blocked else candidate
        rewards = list(self._state.rewards)
        collected_reward = False

        if not blocked and self._contains_position(rewards, next_position):
            rewards = [reward for reward in rewards if not self._same_position(reward, next_position)]
            collected_reward = True

        step_count = self._state.step_count + 1
        terminal_status = self._resolve_status(rewards, step_count, self._state.max_steps)
        reward_value = self._calculate_reward(blocked, collected_reward, terminal_status)
        next_score = self._state.score + reward_value

        self._state = GridState(
            episode_id=self._state.episode_id,
            step_count=step_count,
            rows=self._state.rows,
            cols=self._state.cols,
            grid=self._build_grid(self._state.rows, self._state.cols, next_position, self._state.obstacles, rewards),
            agent_position=next_position,
            obstacles=self._state.obstacles,
            rewards=rewards,
            collected_rewards=self._state.collected_rewards + (1 if collected_reward else 0),
            score=next_score,
            max_steps=self._state.max_steps,
            status=terminal_status,
        )

        return self._to_observation(
            self._build_message(blocked, collected_reward, terminal_status, len(rewards)),
            reward=reward_value,
            done=terminal_status != "running",
        )

    @property
    def state(self) -> GridState:
        return self._state

    def _build_initial_state(
        self,
        rows: int | None = None,
        cols: int | None = None,
        obstacle_count: int | None = None,
        reward_count: int | None = None,
        max_steps: int | None = None,
        seed: int | None = None,
        episode_id: str | None = None,
    ) -> GridState:
        row_count = max(int(rows or self._defaults["rows"]), 4)
        col_count = max(int(cols or self._defaults["cols"]), 4)
        start = GridPosition(row=row_count - 1, col=0)
        occupied = {(start.row, start.col)}
        protected = {
            (start.row, start.col),
            (max(start.row - 1, 0), start.col),
            (start.row, min(start.col + 1, col_count - 1)),
            (max(start.row - 1, 0), min(start.col + 1, col_count - 1)),
        }
        occupied.update(protected)

        random = Random(seed)
        default_obstacle_count = max(4, int(row_count * col_count * self._defaults["obstacle_density"]))
        default_reward_count = max(3, int(row_count * col_count * self._defaults["reward_density"]))

        obstacles = self._scatter_positions(
            random=random,
            rows=row_count,
            cols=col_count,
            count=max(0, int(obstacle_count if obstacle_count is not None else default_obstacle_count)),
            occupied=occupied,
        )
        rewards = self._scatter_positions(
            random=random,
            rows=row_count,
            cols=col_count,
            count=max(1, int(reward_count if reward_count is not None else default_reward_count)),
            occupied=occupied,
        )
        step_limit = int(max_steps) if max_steps is not None else row_count * col_count * self._defaults["max_steps_multiplier"]

        return GridState(
            episode_id=episode_id or str(uuid4()),
            step_count=0,
            rows=row_count,
            cols=col_count,
            grid=self._build_grid(row_count, col_count, start, obstacles, rewards),
            agent_position=start,
            obstacles=obstacles,
            rewards=rewards,
            collected_rewards=0,
            score=0.0,
            max_steps=max(step_limit, 1),
            status="running",
        )

    def _scatter_positions(
        self,
        random: Random,
        rows: int,
        cols: int,
        count: int,
        occupied: set[tuple[int, int]],
    ) -> list[GridPosition]:
        positions: list[GridPosition] = []
        attempts = 0
        max_attempts = rows * cols * 20

        while len(positions) < count and attempts < max_attempts:
            attempts += 1
            row = random.randrange(rows)
            col = random.randrange(cols)
            key = (row, col)
            if key in occupied:
                continue
            occupied.add(key)
            positions.append(GridPosition(row=row, col=col))

        return positions

    def _build_grid(
        self,
        rows: int,
        cols: int,
        agent_position: GridPosition,
        obstacles: list[GridPosition],
        rewards: list[GridPosition],
    ) -> list[list[str]]:
        grid = [["empty" for _ in range(cols)] for _ in range(rows)]
        for obstacle in obstacles:
            grid[obstacle.row][obstacle.col] = "obstacle"
        for reward in rewards:
            grid[reward.row][reward.col] = "reward"
        grid[agent_position.row][agent_position.col] = "agent"
        return grid

    def _to_observation(self, message: str, reward: float, done: bool) -> GridObservation:
        return GridObservation(
            message=message,
            grid=self._state.grid,
            agent_position=self._state.agent_position,
            score=self._state.score,
            steps=self._state.step_count,
            rewards_remaining=len(self._state.rewards),
            collected_rewards=self._state.collected_rewards,
            status=self._state.status,
            reward=reward,
            done=done,
        )

    def _resolve_status(self, rewards: list[GridPosition], step_count: int, max_steps: int) -> str:
        if not rewards:
            return "won"
        if step_count >= max_steps:
            return "lost"
        return "running"

    def _calculate_reward(self, blocked: bool, collected_reward: bool, status: str) -> float:
        reward = INVALID_MOVE_PENALTY if blocked else MOVE_PENALTY
        if collected_reward:
            reward += REWARD_BONUS
        if status == "won":
            reward += WIN_BONUS
        if status == "lost":
            reward += LOSS_PENALTY
        return reward

    def _build_message(self, blocked: bool, collected_reward: bool, status: str, rewards_remaining: int) -> str:
        if status == "won":
            return "All rewards collected. Episode complete."
        if status == "lost":
            return "Step budget exhausted before collecting all rewards."
        if blocked:
            return "Move blocked by the environment. Agent remained in place."
        if collected_reward:
            return f"Reward collected successfully. {rewards_remaining} rewards remaining."
        return "Move applied successfully."

    def _contains_position(self, positions: list[GridPosition], target: GridPosition) -> bool:
        return any(self._same_position(position, target) for position in positions)

    def _same_position(self, left: GridPosition, right: GridPosition) -> bool:
        return left.row == right.row and left.col == right.col

