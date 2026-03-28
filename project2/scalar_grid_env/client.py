from openenv.core.client_types import StepResult
from openenv.core.env_client import EnvClient

from scalar_grid_env.models import GridAction, GridObservation, GridPosition, GridState


class ScalarGridEnv(EnvClient[GridAction, GridObservation, GridState]):
    def _step_payload(self, action: GridAction) -> dict:
        return action.model_dump()

    def _parse_result(self, payload: dict) -> StepResult[GridObservation]:
        observation_data = payload.get("observation", payload.get("data", payload))
        reward = payload.get("reward", observation_data.get("reward", 0.0))
        done = payload.get("done", observation_data.get("done", False))

        observation = GridObservation(
            message=observation_data.get("message", ""),
            grid=observation_data.get("grid", []),
            agent_position=GridPosition.model_validate(
                observation_data.get("agent_position", {"row": 0, "col": 0})
            ),
            score=observation_data.get("score", 0.0),
            steps=observation_data.get("steps", 0),
            rewards_remaining=observation_data.get("rewards_remaining", 0),
            collected_rewards=observation_data.get("collected_rewards", 0),
            status=observation_data.get("status", "running"),
            reward=reward,
            done=done,
        )

        return StepResult(observation=observation, reward=reward, done=done)

    def _parse_state(self, payload: dict) -> GridState:
        state_data = payload.get("state", payload.get("data", payload))
        return GridState.model_validate(state_data)
