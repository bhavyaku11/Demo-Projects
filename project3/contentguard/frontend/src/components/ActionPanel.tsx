import { useEffect, useState, type CSSProperties } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ExternalLink,
  ShieldQuestion,
  Siren,
} from "lucide-react";
import type { Action, ModAction, Observation, ViolationType } from "../types";

interface ActionPanelProps {
  observation: Observation | null;
  loading: boolean;
  onSubmit: (action: Action) => Promise<void>;
}

const decisions: Array<{ value: ModAction; label: string; icon: JSX.Element; hotkey: string }> = [
  { value: "remove", label: "REMOVE", icon: <Ban size={18} />, hotkey: "R" },
  { value: "warn", label: "WARN", icon: <AlertTriangle size={18} />, hotkey: "W" },
  { value: "allow", label: "ALLOW", icon: <CheckCircle2 size={18} />, hotkey: "A" },
  { value: "escalate", label: "ESCALATE", icon: <ExternalLink size={18} />, hotkey: "E" },
];

const violationOptions: Array<{ value: ViolationType; label: string; icon: JSX.Element }> = [
  { value: "spam", label: "Spam", icon: <Siren size={14} /> },
  { value: "hate_speech", label: "Hate Speech", icon: <Ban size={14} /> },
  { value: "misinformation", label: "Misinformation", icon: <ShieldQuestion size={14} /> },
  { value: "harassment", label: "Harassment", icon: <AlertTriangle size={14} /> },
  { value: "none", label: "None", icon: <CheckCircle2 size={14} /> },
];

export function ActionPanel({ observation, loading, onSubmit }: ActionPanelProps) {
  const [decision, setDecision] = useState<ModAction>("allow");
  const [violationType, setViolationType] = useState<ViolationType>("none");
  const [confidence, setConfidence] = useState(0.72);
  const [reasoning, setReasoning] = useState("");

  useEffect(() => {
    setDecision("allow");
    setViolationType("none");
    setConfidence(0.72);
    setReasoning("");
  }, [observation?.post_id]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.target as HTMLElement)?.tagName === "TEXTAREA") {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "r") setDecision("remove");
      if (key === "w") setDecision("warn");
      if (key === "a") setDecision("allow");
      if (key === "e") setDecision("escalate");
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  async function handleSubmit() {
    if (!observation) {
      return;
    }

    await onSubmit({
      post_id: observation.post_id,
      decision,
      violation_type: violationType,
      confidence,
      reasoning,
    });
  }

  const sliderStyle = {
    "--confidence-pct": `${confidence * 100}%`,
  } as CSSProperties;

  return (
    <section className="action-panel">
      <div className="action-panel-header">
        <div className="panel-title">Moderator Decision</div>
        <div className="meta-note">Hotkeys: R / W / A / E</div>
      </div>

      <div className="decision-grid">
        {decisions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`decision-btn ${option.value} ${decision === option.value ? "selected" : ""}`}
            onClick={() => setDecision(option.value)}
            disabled={!observation || loading}
          >
            {option.icon}
            <span>{option.label}</span>
            <span className="shortcut-key">{option.hotkey}</span>
          </button>
        ))}
      </div>

      <div className="violation-grid">
        {violationOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`violation-chip ${violationType === option.value ? "selected" : ""}`}
            onClick={() => setViolationType(option.value)}
            disabled={!observation || loading}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      <div className="confidence-section">
        <div className="confidence-header">
          <div className="confidence-label">Confidence</div>
          <div className="confidence-value">{confidence.toFixed(2)}</div>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={confidence}
          onChange={(event) => setConfidence(Number(event.target.value))}
          disabled={!observation || loading}
          style={sliderStyle}
        />
      </div>

      <div className="reasoning-section">
        <div className="reasoning-meta">
          <div className="confidence-label">Reasoning</div>
          <div className="confidence-value">{reasoning.length}/280</div>
        </div>
        <textarea
          placeholder="Reference context, history, and policy tradeoffs..."
          maxLength={280}
          value={reasoning}
          onChange={(event) => setReasoning(event.target.value)}
          disabled={!observation || loading}
          rows={5}
        />
      </div>

      <div className="submit-section">
        <button
          type="button"
          className="btn-submit"
          onClick={() => void handleSubmit()}
          disabled={!observation || loading}
        >
          {loading ? "Submitting..." : "Submit Decision"}
        </button>
      </div>
    </section>
  );
}
