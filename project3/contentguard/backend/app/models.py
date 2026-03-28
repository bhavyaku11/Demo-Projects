from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ViolationType(str, Enum):
    SPAM = "spam"
    HATE_SPEECH = "hate_speech"
    MISINFORMATION = "misinformation"
    HARASSMENT = "harassment"
    NONE = "none"


class ModAction(str, Enum):
    REMOVE = "remove"
    WARN = "warn"
    ALLOW = "allow"
    ESCALATE = "escalate"


class Observation(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    post_id: str
    content: str
    author_id: str
    author_history: Dict[str, Any]
    context: Dict[str, Any]
    metadata: Dict[str, Any]
    task_id: str
    step_number: int
    max_steps: int


class Action(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    post_id: str
    decision: ModAction
    violation_type: ViolationType
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: Optional[str] = None


class Reward(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    value: float = Field(ge=-1.0, le=1.0)
    breakdown: Dict[str, float]
    feedback: str


class EnvironmentState(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    task_id: str
    step: int
    max_steps: int
    posts_reviewed: int
    correct_decisions: int
    false_positives: int
    false_negatives: int
    cumulative_reward: float
    done: bool
    episode_score: float


class StepResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    observation: Optional[Observation]
    reward: Reward
    done: bool
    info: Dict[str, Any]


class TaskInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    task_id: str
    name: str
    description: str
    difficulty: str
    action_schema: Dict[str, Any]
    max_steps: int
