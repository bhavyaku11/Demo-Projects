import { apiClient } from "@/lib/api/client";

import type {
  Action,
  ArenaGameStateResponse,
  ApiEnvelope,
} from "../types/environment";

interface StartEnvironmentOptions {
  rows: number;
  cols: number;
  obstacleCount: number;
  rewardCount: number;
  maxSteps: number;
}

export function startEnvironment(options: StartEnvironmentOptions) {
  return apiClient<ApiEnvelope<ArenaGameStateResponse>>("/api/game/guess/start", {
    method: "POST",
    body: JSON.stringify(options)
  }).then(res => {
    console.log("API Response (/game/start):", res);
    return res;
  });
}

export function stepEnvironment(action: Action) {
  return apiClient<ApiEnvelope<ArenaGameStateResponse>>("/api/game/guess/move", {
    method: "POST",
    body: JSON.stringify({ direction: action })
  }).then(res => {
    console.log("API Response (/game/move):", res);
    return res;
  });
}

export function getEnvironmentState() {
  return apiClient<ApiEnvelope<ArenaGameStateResponse>>("/api/game/guess/state");
}

export function getEnvironmentScore() {
  return apiClient<ApiEnvelope<ArenaGameStateResponse>>("/api/game/guess/score");
}
