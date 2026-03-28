import { AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { useEnvironment } from "./hooks/useEnvironment";
import { useBaseline } from "./hooks/useBaseline";
import { Header } from "./components/Header";
import { TaskSelector } from "./components/TaskSelector";
import { PostCard } from "./components/PostCard";
import { ActionPanel } from "./components/ActionPanel";
import { RewardDisplay } from "./components/RewardDisplay";
import { EpisodeStats } from "./components/EpisodeStats";
import { BaselineResults } from "./components/BaselineResults";
import { StateViewer } from "./components/StateViewer";
import type { Action } from "./types";

export default function App() {
  const {
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
    startEpisode,
    submitAction,
  } = useEnvironment();

  const {
    baselineResults,
    isRunning: baselineRunning,
    error: baselineError,
    elapsedSeconds,
    runBaseline,
  } = useBaseline();

  const progress = currentState ? (currentState.step / Math.max(currentState.max_steps, 1)) * 100 : 0;
  const latestReward = rewardHistory.length > 0 ? rewardHistory[rewardHistory.length - 1] : null;

  async function handleActionSubmit(action: Action) {
    await submitAction(action);
  }

  return (
    <div className="app-layout">
      <Header apiHealthy={apiHealthy} />

      <aside className="sidebar">
        <TaskSelector
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onStart={(taskId) => void startEpisode(taskId)}
          loading={isLoading}
        />
        <EpisodeStats state={currentState} rewardHistory={rewardHistory} progress={progress} />
      </aside>

      <main className="main">
        {isBooting ? (
          <section className="empty-state">
            <div className="empty-icon">
              <Shield size={20} />
            </div>
            <h2 className="empty-title">Booting environment</h2>
            <p className="empty-desc">Connecting to the backend and loading the first moderation queue.</p>
          </section>
        ) : null}

        {error ? (
          <section className="empty-state">
            <div className="empty-icon">
              <AlertTriangle size={20} />
            </div>
            <h2 className="empty-title">Environment error</h2>
            <p className="empty-desc">{error}</p>
          </section>
        ) : null}

        <AnimatePresence mode="wait">
          <PostCard observation={currentObservation} />
        </AnimatePresence>

        <ActionPanel observation={currentObservation} loading={isLoading} onSubmit={handleActionSubmit} />

        {episodeDone ? (
          <section className="episode-complete">
            <div className="empty-icon">
              <CheckCircle2 size={20} />
            </div>
            <h2 className="empty-title">Episode complete</h2>
            <div className="episode-score">{currentState?.episode_score.toFixed(3) ?? "0.000"}</div>
            <p className="empty-desc">
              Start a fresh run or switch tasks to continue evaluating moderation behavior.
            </p>
          </section>
        ) : null}
      </main>

      <aside className="panel">
        <RewardDisplay latestReward={latestReward} rewardHistory={rewardHistory} />
        <BaselineResults
          baselineResults={baselineResults}
          isRunning={baselineRunning}
          elapsedSeconds={elapsedSeconds}
          error={baselineError}
          onRun={runBaseline}
        />
        <StateViewer state={currentState} />
      </aside>
    </div>
  );
}
