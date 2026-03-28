from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from ..models import Action, Reward


@dataclass
class EasyMetrics:
    reviewed: int = 0
    correct: int = 0
    false_positives: int = 0
    false_negatives: int = 0
    cumulative_reward: float = 0.0


class SpamDetectionGrader:
    def compute_reward(self, action: Action, ground_truth: Dict[str, str], metrics: EasyMetrics) -> Reward:
        correct_decision = ground_truth["decision"]
        correct_violation = ground_truth["violation_type"]
        breakdown: Dict[str, float] = {}

        if action.decision.value == correct_decision:
            breakdown["decision_accuracy"] = 0.6
            metrics.correct += 1
        elif action.decision.value == "warn" and correct_decision in {"remove", "allow"}:
            breakdown["decision_accuracy"] = 0.2
        else:
            breakdown["decision_accuracy"] = 0.0
            if correct_decision == "allow" and action.decision.value == "remove":
                metrics.false_positives += 1
            elif correct_decision == "remove" and action.decision.value == "allow":
                metrics.false_negatives += 1

        if action.violation_type.value == correct_violation:
            breakdown["violation_type"] = 0.3
        elif action.violation_type.value != "none" and correct_violation != "none":
            breakdown["violation_type"] = 0.1
        else:
            breakdown["violation_type"] = 0.0

        if action.decision.value == correct_decision:
            breakdown["confidence"] = round(0.1 * action.confidence, 4)
        else:
            breakdown["confidence"] = round(-0.1 * action.confidence, 4)

        penalty = 0.0
        if action.decision.value == "remove" and correct_decision == "allow" and action.confidence > 0.9:
            penalty = -0.3

        total = max(-1.0, min(1.0, sum(breakdown.values()) + penalty))
        metrics.reviewed += 1
        metrics.cumulative_reward += total

        feedback = (
            f"Expected {correct_decision}/{correct_violation}; received "
            f"{action.decision.value}/{action.violation_type.value}."
        )
        if penalty < 0:
            feedback += " Overconfident false positive penalty applied."

        if correct_decision == "warn" and action.decision.value == "allow":
            feedback += " Borderline spam should usually trigger friction."

        return Reward(value=round(total, 4), breakdown=breakdown, feedback=feedback)

    def grade(self, metrics: EasyMetrics) -> float:
        if metrics.reviewed == 0:
            return 0.0

        precision = metrics.correct / metrics.reviewed
        fp_penalty = (metrics.false_positives / metrics.reviewed) * 0.2
        fn_penalty = (metrics.false_negatives / metrics.reviewed) * 0.3
        return max(0.0, min(1.0, round(precision - fp_penalty - fn_penalty, 4)))
