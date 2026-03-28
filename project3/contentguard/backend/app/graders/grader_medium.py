from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from typing import Dict

from ..models import Action, Reward


@dataclass
class MediumMetrics:
    reviewed: int = 0
    correct: int = 0
    false_positives: int = 0
    false_negatives: int = 0
    cumulative_reward: float = 0.0
    pred_counts: Counter = field(default_factory=Counter)
    actual_counts: Counter = field(default_factory=Counter)
    true_positive_counts: Counter = field(default_factory=Counter)


class HateSpeechGrader:
    def compute_reward(self, action: Action, post: Dict[str, object], metrics: MediumMetrics) -> Reward:
        ground_truth = post["ground_truth"]
        correct_decision = ground_truth["decision"]
        correct_violation = ground_truth["violation_type"]
        targeted_group = post["metadata"].get("targeted_group", "none")
        breakdown: Dict[str, float] = {}

        if action.decision.value == correct_decision:
            breakdown["decision_accuracy"] = 0.5
            metrics.correct += 1
        elif action.decision.value == "warn" and correct_decision in {"remove", "allow"}:
            breakdown["decision_accuracy"] = 0.25
        elif action.decision.value == "escalate" and correct_decision in {"warn", "remove"}:
            breakdown["decision_accuracy"] = 0.2
        else:
            breakdown["decision_accuracy"] = 0.0

        if action.violation_type.value == correct_violation:
            breakdown["violation_type"] = 0.35
        elif action.violation_type.value in {"hate_speech", "harassment"} and correct_violation in {"hate_speech", "harassment"}:
            breakdown["violation_type"] = 0.15
        else:
            breakdown["violation_type"] = 0.0

        if action.decision.value == correct_decision:
            breakdown["confidence"] = round(0.15 * action.confidence, 4)
        else:
            breakdown["confidence"] = round(-0.15 * action.confidence, 4)

        minority_self_reference = (
            post["context"].get("speaker_identity") == targeted_group and correct_decision == "allow"
        )
        penalty = 0.0
        if minority_self_reference and action.decision.value == "remove":
            penalty -= 0.4
        elif correct_decision == "remove" and action.decision.value == "warn":
            penalty += 0.05

        if correct_decision == "allow" and action.decision.value in {"remove", "warn"}:
            metrics.false_positives += 1
        elif correct_decision == "remove" and action.decision.value == "allow":
            metrics.false_negatives += 1

        actual_label = correct_violation if correct_decision != "allow" else "none"
        predicted_label = action.violation_type.value if action.decision.value != "allow" else "none"
        metrics.actual_counts[actual_label] += 1
        metrics.pred_counts[predicted_label] += 1
        if actual_label == predicted_label:
            metrics.true_positive_counts[actual_label] += 1

        total = max(-1.0, min(1.0, sum(breakdown.values()) + penalty))
        metrics.reviewed += 1
        metrics.cumulative_reward += total

        feedback = (
            f"Expected {correct_decision}/{correct_violation}; received "
            f"{action.decision.value}/{action.violation_type.value}."
        )
        if minority_self_reference and action.decision.value == "remove":
            feedback += " The speaker appears to be discussing their own protected-group experience."

        return Reward(value=round(total, 4), breakdown=breakdown, feedback=feedback)

    def grade(self, metrics: MediumMetrics) -> float:
        if metrics.reviewed == 0:
            return 0.0

        labels = ["hate_speech", "harassment", "none"]
        f1_scores = []
        for label in labels:
            tp = metrics.true_positive_counts[label]
            fp = max(metrics.pred_counts[label] - tp, 0)
            fn = max(metrics.actual_counts[label] - tp, 0)
            precision = tp / (tp + fp) if (tp + fp) else 0.0
            recall = tp / (tp + fn) if (tp + fn) else 0.0
            if precision + recall == 0:
                f1 = 0.0
            else:
                f1 = 2 * precision * recall / (precision + recall)
            f1_scores.append(f1)

        macro_f1 = sum(f1_scores) / len(f1_scores)
        fp_penalty = (metrics.false_positives / metrics.reviewed) * 0.1
        fn_penalty = (metrics.false_negatives / metrics.reviewed) * 0.15
        return max(0.0, min(1.0, round(macro_f1 - fp_penalty - fn_penalty, 4)))
