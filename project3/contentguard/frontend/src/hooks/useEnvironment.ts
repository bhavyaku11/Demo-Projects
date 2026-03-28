import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Action, EnvironmentState, Observation, Reward, TaskInfo } from "../types";

export function useEnvironment() {
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [currentObservation, setCurrentObservation] = useState<Observation | null>(null);
  const [currentState, setCurrentState] = useState<EnvironmentState | null>(null);
  const [rewardHistory, setRewardHistory] = useState<Reward[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("spam_detection");
  const [isLoading, setIsLoading] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [episodeDone, setEpisodeDone] = useState(false);
  const [apiHealthy, setApiHealthy] = useState(false);

  async function refreshState() {
    try {
      const state = await api.getState();
      if ("task_id" in state) {
        setCurrentState(state as EnvironmentState);
        setEpisodeDone(Boolean((state as EnvironmentState).done));
      }
    } catch (refreshError) {
      console.error(refreshError);
    }
  }

  async function loadTasks() {
    const availableTasks = await api.getTasks();
    setTasks(availableTasks);
  }

  async function checkHealth() {
    try {
      await api.health();
      setApiHealthy(true);
      return true;
    } catch (healthError) {
      setApiHealthy(false);
      setError("Unable to reach the ContentGuard API.");
      console.error(healthError);
      return false;
    }
  }

  async function startEpisode(taskId: string) {
    setIsLoading(true);
    setError(null);
    try {
      const observation = await api.reset(taskId);
      setSelectedTaskId(taskId);
      setCurrentObservation(observation);
      setRewardHistory([]);
      setEpisodeDone(false);
      await refreshState();
    } catch (resetError) {
      setError("Failed to start a new episode.");
      console.error(resetError);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAction(action: Action) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.step(action);
      setCurrentObservation(result.observation);
      setRewardHistory((previous) => [...previous, result.reward]);
      setEpisodeDone(result.done);
      await refreshState();
      return result;
    } catch (stepError) {
      setError("The action could not be submitted.");
      console.error(stepError);
      throw stepError;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setIsBooting(true);
      const healthy = await checkHealth();
      if (!healthy || !mounted) {
        setIsBooting(false);
        return;
      }

      try {
        await loadTasks();
        if (mounted) {
          await startEpisode("spam_detection");
        }
      } finally {
        if (mounted) {
          setIsBooting(false);
        }
      }
    }

    bootstrap();
    const healthInterval = window.setInterval(() => {
      void checkHealth();
    }, 10000);

    return () => {
      mounted = false;
      window.clearInterval(healthInterval);
    };
  }, []);

  return {
    tasks,
    currentObservation,
    currentState,
    rewardHistory,
    selectedTaskId,
    isLoading,
    isBooting,
    error,
    episodeDone,
    apiHealthy,
    setSelectedTaskId,
    startEpisode,
    submitAction,
    refreshState,
  };
}
