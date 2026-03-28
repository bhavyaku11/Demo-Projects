import { useState } from "react";
import { api } from "../api/client";
import type { BaselineScores } from "../types";

export function useBaseline() {
  const [baselineResults, setBaselineResults] = useState<BaselineScores | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  async function runBaseline() {
    setIsRunning(true);
    setError(null);
    setElapsedSeconds(0);

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    try {
      const response = await api.runBaseline();
      setBaselineResults(response.scores);
      return response.scores;
    } catch (runError) {
      setError("Baseline execution failed. Check the backend logs and OPENAI_API_KEY.");
      console.error(runError);
      return null;
    } finally {
      window.clearInterval(timer);
      setIsRunning(false);
    }
  }

  return {
    baselineResults,
    isRunning,
    error,
    elapsedSeconds,
    runBaseline,
  };
}
