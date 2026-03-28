from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Tuple

from ..models import Action, Reward


@dataclass
class HardMetrics:
    reviewed: int = 0
    correct: int = 0
    false_positives: int = 0
    false_negatives: int = 0
    cumulative_reward: float = 0.0
    reasoning_scores: List[float] = field(default_factory=list)
    decision_history: List[Tuple[str, str]] = field(default_factory=list)


class NuancedModerationGrader:
    def compute_reward(self, action: Action, post: Dict[str, object], metrics: HardMetrics) -> Reward:
        ground_truth = post["ground_truth"]
        explanation = post["context"].get("explanation", "")
        keywords = ground_truth.get("reasoning_keywords") or self._extract_keywords(explanation)
        breakdown: Dict[str, float] = {}

        if action.decision.value == ground_truth["decision"]:
            breakdown["decision_accuracy"] = 0.4
            metrics.correct += 1
        elif action.decision.value == "escalate" and ground_truth["decision"] in {"warn", "remove"}:
            breakdown["decision_accuracy"] = 0.22
        elif action.decision.value == "warn" and ground_truth["decision"] in {"allow", "remove"}:
            breakdown["decision_accuracy"] = 0.18
        else:
            breakdown["decision_accuracy"] = 0.0

        reasoning_text = (action.reasoning or "").lower()
        keyword_hits = sum(1 for keyword in keywords if keyword in reasoning_text)
        context_utilization = min(1.0, keyword_hits / max(len(keywords), 1))
        breakdown["context_utilization"] = round(0.2 * context_utilization, 4)
        breakdown["reasoning_quality"] = round(0.3 * context_utilization, 4)
        metrics.reasoning_scores.append(context_utilization)

        policy_consistency = self._policy_consistency(action, post, metrics)
        breakdown["policy_consistency"] = round(policy_consistency, 4)

        if action.decision.value == ground_truth["decision"]:
            breakdown["confidence"] = round(0.1 * action.confidence, 4)
        else:
            breakdown["confidence"] = round(-0.1 * action.confidence, 4)

        if ground_truth["decision"] == "allow" and action.decision.value == "remove":
            metrics.false_positives += 1
        elif ground_truth["decision"] == "remove" and action.decision.value == "allow":
            metrics.false_negatives += 1

        total = max(-1.0, min(1.0, sum(breakdown.values())))
        metrics.reviewed += 1
        metrics.cumulative_reward += total
        metrics.decision_history.append((post["context"].get("scenario_type", "unknown"), action.decision.value))

        feedback = (
            f"Expected {ground_truth['decision']}/{ground_truth['violation_type']}; "
            f"received {action.decision.value}/{action.violation_type.value}."
        )
        if keyword_hits == 0:
            feedback += " Reasoning missed key context."
        else:
            feedback += f" Reasoning referenced {keyword_hits} contextual factor(s)."

        return Reward(value=round(total, 4), breakdown=breakdown, feedback=feedback)

    def grade(self, metrics: HardMetrics) -> float:
        if metrics.reviewed == 0:
            return 0.0

        accuracy = metrics.correct / metrics.reviewed
        reasoning = sum(metrics.reasoning_scores) / len(metrics.reasoning_scores) if metrics.reasoning_scores else 0.0
        fp_penalty = (metrics.false_positives / metrics.reviewed) * 0.1
        fn_penalty = (metrics.false_negatives / metrics.reviewed) * 0.15
        score = (0.45 * accuracy) + (0.4 * reasoning) + (0.15 * max(0.0, 1 - fp_penalty - fn_penalty))
        return max(0.0, min(1.0, round(score, 4)))

    def _extract_keywords(self, explanation: str) -> List[str]:
        tokens = re.findall(r"[a-zA-Z]{5,}", explanation.lower())
        seen: List[str] = []
        for token in tokens:
            if token not in seen:
                seen.append(token)
        return seen[:5] or ["context"]

    def _policy_consistency(self, action: Action, post: Dict[str, object], metrics: HardMetrics) -> float:
        scenario_type = post["context"].get("scenario_type", "unknown")
        prior_similar = [decision for prior_type, decision in metrics.decision_history if prior_type == scenario_type]
        if not prior_similar:
            return 0.2

        most_common = max(set(prior_similar), key=prior_similar.count)
        if most_common == action.decision.value:
            return 0.2

        if {most_common, action.decision.value} <= {"warn", "escalate"}:
            return 0.1

        return -0.05
