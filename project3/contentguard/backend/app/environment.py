from __future__ import annotations

from .models import Action, Observation
from .tasks.task_easy import SpamDetectionTask
from .tasks.task_hard import NuancedModerationTask
from .tasks.task_medium import HateSpeechTask


class ContentGuardEnv:
    TASKS = {
        "spam_detection": SpamDetectionTask,
        "hate_speech": HateSpeechTask,
        "nuanced_moderation": NuancedModerationTask,
    }

    def __init__(self) -> None:
        self.current_task = None
        self.task_id = None

    def reset(self, task_id: str = "spam_detection") -> Observation:
        if task_id not in self.TASKS:
            raise ValueError(f"Unknown task: {task_id}. Valid: {list(self.TASKS.keys())}")
        self.task_id = task_id
        self.current_task = self.TASKS[task_id]()
        return self.current_task.reset()

    def step(self, action: Action):
        if not self.current_task:
            raise RuntimeError("Call reset() before step()")
        return self.current_task.step(action)

    def state(self) -> dict:
        if not self.current_task:
            return {"error": "No active episode. Call reset() first."}
        return self.current_task.get_state()

    def grade(self) -> float:
        if not self.current_task:
            return 0.0
        return self.current_task.grade()
