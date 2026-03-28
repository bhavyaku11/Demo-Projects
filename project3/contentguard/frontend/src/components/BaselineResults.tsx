import { LoaderCircle, Play } from "lucide-react";
import type { BaselineScores } from "../types";

interface BaselineResultsProps {
  baselineResults: BaselineScores | null;
  isRunning: boolean;
  elapsedSeconds: number;
  error: string | null;
  onRun: () => Promise<unknown>;
}

function barClass(value: number) {
  if (value >= 0.7) return "great";
  if (value >= 0.4) return "good";
  return "poor";
}

export function BaselineResults({
  baselineResults,
  isRunning,
  elapsedSeconds,
  error,
  onRun,
}: BaselineResultsProps) {
  const entries = baselineResults
    ? Object.entries(baselineResults).map(([label, value]) => ({ label, value }))
    : [];

  return (
    <section className="baseline-card">
      <div className="baseline-card-header">
        <div className="panel-title">Baseline</div>
        <button type="button" className="btn-baseline" onClick={() => void onRun()} disabled={isRunning}>
          {isRunning ? <LoaderCircle size={14} className="spin" /> : <Play size={14} />}
          {isRunning ? `Running ${elapsedSeconds}s` : "Run Baseline"}
        </button>
      </div>

      {error ? (
        <div className="baseline-bars">
          <p className="error-text">{error}</p>
        </div>
      ) : null}

      {entries.length > 0 ? (
        <div className="baseline-bars">
          {entries.map(({ label, value }) => (
            <div key={label} className="baseline-bar-row">
              <div className="baseline-bar-header">
                <span className="baseline-bar-name">{label.replace(/_/g, " ")}</span>
                <span className="baseline-bar-score">{value.toFixed(2)}</span>
              </div>
              <div className="baseline-track">
                <div className={`baseline-fill ${barClass(value)}`} style={{ width: `${value * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="baseline-bars">
          <p className="section-copy">
            Run the synchronous backend baseline to compare your manual moderation loop against <code>gpt-4o-mini</code>.
          </p>
        </div>
      )}
    </section>
  );
}
