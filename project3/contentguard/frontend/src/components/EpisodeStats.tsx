import type { EnvironmentState, Reward } from "../types";

interface EpisodeStatsProps {
  state: EnvironmentState | null;
  rewardHistory: Reward[];
  progress: number;
}

function chartPath(values: number[]) {
  if (values.length === 0) {
    return "";
  }

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 28 - value * 28;
      return `${x},${y}`;
    })
    .join(" ");
}

export function EpisodeStats({ state, rewardHistory, progress }: EpisodeStatsProps) {
  const accuracy = state ? state.correct_decisions / Math.max(state.posts_reviewed, 1) : 0;
  const stepsRemaining = state ? Math.max(state.max_steps - state.step, 0) : 0;
  const cumulativeReward = state?.cumulative_reward ?? 0;
  const f1Score = state?.episode_score ?? 0;
  const accuracySeries = rewardHistory.map((_, index) => {
    if (!state || state.posts_reviewed === 0) {
      return 0;
    }
    return Math.min(1, ((index + 1) / Math.max(state.posts_reviewed, 1)) * accuracy);
  });

  return (
    <section>
      <div className="sidebar-section-label">Episode Stats</div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Accuracy</div>
          <div className="stat-value positive">{(accuracy * 100).toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Steps Left</div>
          <div className="stat-value">{stepsRemaining}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cum. Reward</div>
          <div className={`stat-value ${cumulativeReward >= 0 ? "positive" : "negative"}`}>
            {cumulativeReward.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">F1 Score</div>
          <div className="stat-value warning">{f1Score.toFixed(3)}</div>
        </div>
      </div>

      <div className="progress-wrap">
        <div className="progress-header">
          <div className="progress-label">Episode Progress</div>
          <div className="progress-count">
            {state?.step ?? 0}/{state?.max_steps ?? 0}
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="progress-wrap">
        <div className="progress-header">
          <div className="progress-label">Accuracy Trace</div>
          <div className="progress-count">{rewardHistory.length} steps</div>
        </div>
        <svg viewBox="0 0 100 28" className="sparkline">
          <polyline fill="none" stroke="var(--cyan-400)" strokeWidth="2" points={chartPath(accuracySeries)} />
        </svg>
      </div>
    </section>
  );
}
