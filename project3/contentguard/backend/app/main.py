from __future__ import annotations

import json
import os
import subprocess
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Union

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .environment import ContentGuardEnv
from .models import Action, EnvironmentState, Observation, StepResult, TaskInfo

env = ContentGuardEnv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    env.reset("spam_detection")
    yield


app = FastAPI(
    title="ContentGuard OpenEnv",
    description="Social media content moderation environment for AI agent training",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "env": "ContentGuard", "version": "1.0.0"}


@app.post("/reset", response_model=Observation)
def reset(task_id: str = "spam_detection"):
    try:
        return env.reset(task_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/step", response_model=StepResult)
def step(action: Action):
    try:
        observation, reward, done = env.step(action)
        return StepResult(
            observation=observation,
            reward=reward,
            done=done,
            info=env.state(),
        )
    except RuntimeError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/state", response_model=Union[EnvironmentState, Dict[str, str]])
def state():
    return env.state()


@app.get("/tasks", response_model=list[TaskInfo])
def list_tasks():
    return [
        TaskInfo(
            task_id="spam_detection",
            name="Spam Detection",
            description="Identify and action spam posts. Easy difficulty.",
            difficulty="easy",
            action_schema=Action.model_json_schema(),
            max_steps=20,
        ),
        TaskInfo(
            task_id="hate_speech",
            name="Hate Speech Classification",
            description="Classify hate speech types and take appropriate action. Medium difficulty.",
            difficulty="medium",
            action_schema=Action.model_json_schema(),
            max_steps=25,
        ),
        TaskInfo(
            task_id="nuanced_moderation",
            name="Nuanced Context-Based Moderation",
            description="Context-dependent moderation requiring policy reasoning. Hard difficulty.",
            difficulty="hard",
            action_schema=Action.model_json_schema(),
            max_steps=15,
        ),
    ]


@app.get("/grader")
def grader():
    current_state = env.state()
    return {
        "task_id": current_state.get("task_id"),
        "final_score": env.grade(),
        "state": current_state,
    }


@app.post("/baseline")
def run_baseline():
    try:
        app_dir = Path(__file__).resolve().parent
        result = subprocess.run(
            [sys.executable, str(app_dir / "baseline.py")],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=str(app_dir.parent),
            env={**os.environ},
        )
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Baseline failed: {result.stderr or result.stdout}")
        marker = "BASELINE_SCORES:"
        if marker not in result.stdout:
            raise HTTPException(status_code=500, detail="Baseline output did not include parseable scores.")
        scores = json.loads(result.stdout.split(marker, maxsplit=1)[-1].strip())
        return {"status": "success", "scores": scores}
    except subprocess.TimeoutExpired as error:
        raise HTTPException(status_code=504, detail="Baseline script timed out") from error
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
