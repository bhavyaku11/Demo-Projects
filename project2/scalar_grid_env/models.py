from typing import Literal

from pydantic import BaseModel, Field
from openenv.core.env_server.types import Action, Observation, State


class GridPosition(BaseModel):
    row: int = Field(..., description="Zero-based row index in the grid.")
    col: int = Field(..., description="Zero-based column index in the grid.")


class GridAction(Action):
    action: Literal["up", "down", "left", "right"] = Field(
        ...,
        description="Directional movement command for the agent."
    )


class GridObservation(Observation):
    message: str = Field(..., description="Human-readable result of the latest transition.")
    grid: list[list[str]] = Field(..., description="Current 2D environment snapshot.")
    agent_position: GridPosition = Field(..., description="Current agent location.")
    score: float = Field(..., description="Accumulated environment score.")
    steps: int = Field(..., description="Total number of steps taken in this episode.")
    rewards_remaining: int = Field(..., description="Number of rewards not yet collected.")
    collected_rewards: int = Field(..., description="Number of rewards collected so far.")
    status: Literal["running", "won", "lost"] = Field(..., description="Current episode status.")


class GridState(State):
    rows: int = Field(..., description="Number of rows in the environment.")
    cols: int = Field(..., description="Number of columns in the environment.")
    grid: list[list[str]] = Field(..., description="Current 2D environment snapshot.")
    agent_position: GridPosition = Field(..., description="Current agent location.")
    obstacles: list[GridPosition] = Field(default_factory=list, description="Obstacle coordinates.")
    rewards: list[GridPosition] = Field(default_factory=list, description="Remaining reward coordinates.")
    collected_rewards: int = Field(0, description="Number of rewards collected so far.")
    score: float = Field(0.0, description="Accumulated environment score.")
    max_steps: int = Field(..., description="Maximum allowed step count before termination.")
    status: Literal["running", "won", "lost"] = Field("running", description="Current episode status.")
