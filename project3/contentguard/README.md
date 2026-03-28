# ContentGuard — OpenEnv Social Media Moderation Environment

## Overview
ContentGuard simulates a real-world social media content moderation pipeline for training and evaluating AI agents. Each episode presents a stream of posts with author history, community context, engagement metadata, and task-specific policy ambiguity. The agent must choose a moderation action, assign a violation type, calibrate confidence, and optionally explain its reasoning.

The environment is designed for the Meta x Scaler OpenEnv Hackathon and supports three progressively harder moderation tracks: spam detection, hate speech classification, and nuanced context-based policy enforcement. It exposes a clean FastAPI interface, a typed React/Vite operator console, task graders, Docker assets, and an OpenAI baseline script for quick benchmarking.

## Motivation
Content moderation is a strong benchmark for RL and agentic systems because good behavior requires more than classification accuracy. A capable moderation agent has to weigh false positives against false negatives, distinguish direct harms from quoted or reported harms, remain calibrated under uncertainty, and stay consistent across an episode. That makes moderation a useful proxy for broader real-world agent alignment challenges where policy, context, and uncertainty all matter at once.

Most benchmark environments flatten those decisions into a single label. ContentGuard instead turns moderation into a sequential decision problem with shaped step rewards, live state, and multiple policy surfaces. This makes it useful for reinforcement learning, imitation learning, evaluator construction, tool-using agents, and policy reasoning experiments.

Because the tasks cover obvious abuse, borderline content, reclaimed language, satire, journalism, fiction, and harm-reduction content, the environment is also a good stress test for context-sensitive LLM behavior. Agents that over-remove or under-enforce will show it clearly in the reward trace and final grader score.

## Environment Architecture

### Observation Space

| Field | Type | Description |
|------|------|-------------|
| `post_id` | `string` | Unique identifier for the current post |
| `content` | `string` | Raw post text shown to the agent |
| `author_id` | `string` | Author identifier |
| `author_history` | `object` | Account features such as prior violations, account age, follower count |
| `context` | `object` | Community, language, thread data, and for hard tasks an explanation of nuance |
| `metadata` | `object` | Engagement, link flags, surface-risk indicators, and task-specific signals |
| `task_id` | `string` | Active task identifier |
| `step_number` | `integer` | Current step index within the episode |
| `max_steps` | `integer` | Maximum number of steps for the current task |

### Action Space

| Field | Type | Description | Valid Values |
|------|------|-------------|--------------|
| `post_id` | `string` | Post identifier echoed back to the environment | Current observation `post_id` |
| `decision` | `string` | Moderation action | `remove`, `warn`, `allow`, `escalate` |
| `violation_type` | `string` | Predicted violation class | `spam`, `hate_speech`, `misinformation`, `harassment`, `none` |
| `confidence` | `number` | Agent confidence from 0 to 1 | `[0.0, 1.0]` |
| `reasoning` | `string` | Optional explanation used heavily by the hard task | Free text |

### Reward Function

Each task emits dense reward on every step, clipped to `[-1, 1]`.

Task 1, Spam Detection:

`R_easy = decision_accuracy + violation_type + confidence + penalty`

- `decision_accuracy ∈ {0.6, 0.2, 0.0}`
- `violation_type ∈ {0.3, 0.1, 0.0}`
- `confidence = ±0.1 * confidence_score`
- `penalty = -0.3` for overconfident false-positive removals on clearly allowed content

Task 2, Hate Speech Classification:

`R_medium = decision_accuracy + violation_type + confidence + minority_penalty + borderline_bonus`

- `decision_accuracy ∈ {0.5, 0.25, 0.2, 0.0}`
- `violation_type ∈ {0.35, 0.15, 0.0}`
- `confidence = ±0.15 * confidence_score`
- `minority_penalty = -0.4` when the agent removes minority self-reference that should be allowed
- Small partial credit is preserved for warning on borderline cases

Task 3, Nuanced Moderation:

`R_hard = 0.4 * decision + 0.2 * context_utilization + 0.3 * reasoning_quality + 0.2 * policy_consistency + 0.1 * confidence`

- `decision` rewards the selected action relative to the gold action
- `context_utilization` checks whether reasoning mentions key contextual factors
- `reasoning_quality` measures overlap with nuance keywords
- `policy_consistency` rewards consistent handling of similar scenarios across the episode
- `confidence` rewards calibrated certainty and penalizes overconfidence when wrong

## Tasks

### Task 1: Spam Detection (Easy)
- Objective: Identify obvious spam, legitimate posts, and borderline self-promotion.
- Dataset: 60 realistic posts covering phishing, link spam, fake giveaways, repetitive promotions, normal commerce, community announcements, and legitimate information sharing.
- Grading: Accuracy with explicit false-positive and false-negative penalties.
- Expected baseline score: around `0.82`.

### Task 2: Hate Speech Classification (Medium)
- Objective: Distinguish direct hate speech, harassment, coded hate, satire, reclaimed identity, and heated but allowed political speech.
- Dataset: 60 posts across explicit dehumanization, dog whistles, harassment, self-reference, reporting, and political debate.
- Grading: Macro-style F1 across `hate_speech`, `harassment`, and `none`, plus moderation penalties.
- Expected baseline score: around `0.71`.

### Task 3: Nuanced Context-Based Moderation (Hard)
- Objective: Make context-sensitive decisions on journalism, satire, fiction, harm-reduction, cultural references, sarcasm, minority self-reference, and historical quotation.
- Dataset: 35 deliberately ambiguous cases with explicit `context.explanation` notes for policy nuance.
- Grading: Weighted blend of action quality, reasoning quality, context usage, and policy consistency.
- Expected baseline score: around `0.54`.

## Setup & Usage

### Prerequisites
- Python 3.11+
- Node.js 20+
- Optional Docker / Docker Compose
- `OPENAI_API_KEY` only if you want to run the baseline

### Docker

```bash
docker build -t contentguard ./backend
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-... contentguard
```

### Local Development

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

### Running Baseline

```bash
OPENAI_API_KEY=sk-... python backend/app/baseline.py
```

## Baseline Scores

| Task | Model | Score |
|------|-------|-------|
| Spam Detection | `gpt-4o-mini` | `~0.82` |
| Hate Speech | `gpt-4o-mini` | `~0.71` |
| Nuanced Moderation | `gpt-4o-mini` | `~0.54` |

## API Reference

### `GET /health`

```bash
curl http://localhost:8000/health
```

### `POST /reset?task_id=spam_detection`

```bash
curl -X POST "http://localhost:8000/reset?task_id=spam_detection"
```

### `POST /step`

```bash
curl -X POST http://localhost:8000/step \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "easy_001",
    "decision": "remove",
    "violation_type": "spam",
    "confidence": 0.94,
    "reasoning": "Repeated commercial pitch with phishing-style urgency."
  }'
```

### `GET /state`

```bash
curl http://localhost:8000/state
```

### `GET /tasks`

```bash
curl http://localhost:8000/tasks
```

### `GET /grader`

```bash
curl http://localhost:8000/grader
```

### `POST /baseline`

```bash
curl -X POST http://localhost:8000/baseline
```

## OpenEnv Metadata

The environment manifest lives at `backend/openenv.yaml` and declares:
- Observation schema
- Action schema
- Reward range
- Available tasks
- Reset / step / grader endpoints

## Project Layout

```text
contentguard/
├── backend/
│   ├── app/
│   ├── openenv.yaml
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── README.md
└── docker-compose.yml
```
