import type { GameSession, GuessRequest, GuessResult } from "@scalar/shared";

import { apiClient } from "@/lib/api/client";

export function startGame() {
  return apiClient<GameSession>("/game/guess/start", {
    method: "POST"
  });
}

export function submitGuess(sessionId: string, payload: GuessRequest) {
  return apiClient<GuessResult>(`/game/guess/${sessionId}/guess`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
