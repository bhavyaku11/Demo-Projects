import { AnimatePresence, motion } from "framer-motion";
import type { Reward } from "../types";

interface RewardDisplayProps {
  latestReward: Reward | null;
  rewardHistory: Reward[];
}

function sparklinePoints(values: number[]) {
  if (values.length === 0) {
    return "";
  }

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const normalized = (value + 1) / 2;
      const y = 40 - normalized * 40;
      return `${x},${y}`;
    })
    .join(" ");
}

export function RewardDisplay({ latestReward, rewardHistory }: RewardDisplayProps) {
  const recentValues = rewardHistory.slice(-10).map((reward) => reward.value);
  const totalReward = rewardHistory.reduce((sum, reward) => sum + reward.value, 0);
  const rewardTone = latestReward
    ? latestReward.value > 0
      ? "positive"
      : latestReward.value < 0
        ? "negative"
        : "neutral"
    : "neutral";

  return (
    <section className="reward-card">
      <div className="reward-card-header">
        <div className="panel-title">Step Feedback</div>
        <div className="meta-note">Episode total {totalReward.toFixed(2)}</div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={latestReward ? `${rewardHistory.length}-${latestReward.value}` : "empty"}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          className="reward-hero"
        >
          <div className={`reward-number ${rewardTone}`}>{latestReward ? latestReward.value.toFixed(3) : "0.000"}</div>
          <div className="reward-unit">reward</div>
        </motion.div>
      </AnimatePresence>

      <div className="reward-feedback">
        {latestReward?.feedback ?? "Submit an action to receive shaped reward feedback."}
      </div>

      <div className="breakdown-list">
        {latestReward ? (
          Object.entries(latestReward.breakdown).map(([key, value]) => (
            <div key={key} className="breakdown-item">
              <div className="breakdown-header">
                <span className="breakdown-key">{key.replace(/_/g, " ")}</span>
                <span className="breakdown-val">{value.toFixed(3)}</span>
              </div>
              <div className="breakdown-track">
                <div
                  className={`breakdown-fill ${value >= 0 ? "positive" : "negative"}`}
                  style={{ width: `${Math.min(Math.abs(value) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="section-copy">Reward breakdown bars will appear after the first step.</p>
        )}
      </div>

      <div className="sparkline-wrap">
        <div className="breakdown-header">
          <span className="breakdown-key">reward trend</span>
          <span className="breakdown-val">{rewardHistory.length} steps</span>
        </div>
        <svg viewBox="0 0 100 40" className="sparkline">
          <polyline className="sparkline-path" points={sparklinePoints(recentValues)} />
        </svg>
      </div>
    </section>
  );
}
