"""
Baseline inference script using the OpenAI API client.
Uses gpt-4o-mini as a baseline agent against all 3 ContentGuard tasks.
"""

from __future__ import annotations

import json
import os
import sys

import requests
from openai import OpenAI

API_BASE = os.getenv("CONTENTGUARD_API_URL", "http://localhost:8000")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is required to run the ContentGuard baseline.")

client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = """You are a content moderation AI. You will be shown social media posts and must decide:
1. decision: one of "remove", "warn", "allow", "escalate"
2. violation_type: one of "spam", "hate_speech", "misinformation", "harassment", "none"
3. confidence: float 0.0-1.0
4. reasoning: brief explanation

Respond ONLY with valid JSON matching this schema:
{"post_id": "...", "decision": "...", "violation_type": "...", "confidence": 0.0, "reasoning": "..."}"""


def run_task(task_id: str) -> float:
    reset_response = requests.post(f"{API_BASE}/reset", params={"task_id": task_id}, timeout=30)
    reset_response.raise_for_status()
    observation = reset_response.json()

    while True:
        prompt = f"""Post ID: {observation['post_id']}
Content: {observation['content']}
Author history: {json.dumps(observation['author_history'])}
Context: {json.dumps(observation['context'])}
Metadata: {json.dumps(observation['metadata'])}

Make your moderation decision."""

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )

        action_data = json.loads(completion.choices[0].message.content or "{}")
        action_data["post_id"] = observation["post_id"]

        step_response = requests.post(f"{API_BASE}/step", json=action_data, timeout=30)
        step_response.raise_for_status()
        result = step_response.json()

        if result["done"]:
            break
        observation = result["observation"]

    grader_response = requests.get(f"{API_BASE}/grader", timeout=30)
    grader_response.raise_for_status()
    return float(grader_response.json()["final_score"])


def main():
    tasks = ["spam_detection", "hate_speech", "nuanced_moderation"]
    scores = {}

    for task_id in tasks:
        print(f"Running baseline on {task_id}...", file=sys.stderr)
        try:
            score = run_task(task_id)
            scores[task_id] = round(score, 4)
            print(f"  {task_id}: {score:.4f}", file=sys.stderr)
        except Exception as error:  # pragma: no cover - operational baseline fallback
            scores[task_id] = 0.0
            print(f"  {task_id}: ERROR - {error}", file=sys.stderr)

    print(f"BASELINE_SCORES:{json.dumps(scores)}")


if __name__ == "__main__":
    main()
