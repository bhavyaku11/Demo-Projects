from __future__ import annotations

import json
import random
from pathlib import Path

from ..graders.grader_easy import EasyMetrics, SpamDetectionGrader
from ..models import Action, Observation


class SpamDetectionTask:
    TASK_ID = "spam_detection"
    NAME = "Spam Detection"
    DIFFICULTY = "easy"
    MAX_STEPS = 20

    def __init__(self) -> None:
        data_path = Path(__file__).parent.parent / "data" / "posts_easy.json"
        with data_path.open(encoding="utf-8") as file:
            self.posts = json.load(file)
        self.grader = SpamDetectionGrader()
        self.reset()

    def reset(self) -> Observation:
        self.queue = random.sample(self.posts, min(self.MAX_STEPS, len(self.posts)))
        self.step_idx = 0
        self.metrics = EasyMetrics()
        return self._make_observation()

    def _make_observation(self) -> Observation:
        post = self.queue[self.step_idx]
        return Observation(
            post_id=post["post_id"],
            content=post["content"],
            author_id=post["author_id"],
            author_history=post["author_history"],
            context=post["context"],
            metadata=post["metadata"],
            task_id=self.TASK_ID,
            step_number=self.step_idx,
            max_steps=self.MAX_STEPS,
        )

    def step(self, action: Action):
        post = self.queue[self.step_idx]
        reward = self.grader.compute_reward(action, post["ground_truth"], self.metrics)
        self.step_idx += 1
        done = self.step_idx >= len(self.queue)
        observation = self._make_observation() if not done else None
        return observation, reward, done

    def get_state(self):
        reviewed = self.metrics.reviewed
        return {
            "task_id": self.TASK_ID,
            "step": self.step_idx,
            "max_steps": self.MAX_STEPS,
            "posts_reviewed": reviewed,
            "correct_decisions": self.metrics.correct,
            "false_positives": self.metrics.false_positives,
            "false_negatives": self.metrics.false_negatives,
            "cumulative_reward": round(self.metrics.cumulative_reward, 4),
            "done": self.step_idx >= len(self.queue),
            "episode_score": round(self.metrics.correct / max(reviewed, 1), 4),
        }

    def grade(self) -> float:
        return self.grader.grade(self.metrics)
