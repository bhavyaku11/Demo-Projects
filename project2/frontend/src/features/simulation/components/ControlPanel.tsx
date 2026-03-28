import { useEffect } from "react";

import type { Action } from "../types/environment";

interface ControlPanelProps {
  controlsDisabled: boolean;
  isStarting: boolean;
  onReset: () => void;
  onStart: () => void;
  onStep: (action: Action) => void;
}

const ACTION_BUTTONS: Array<{ action: Action; icon: string; label: string; position: string }> = [
  { action: "up", icon: "↑", label: "Move up", position: "col-start-2" },
  { action: "left", icon: "←", label: "Move left", position: "col-start-1 row-start-2" },
  { action: "right", icon: "→", label: "Move right", position: "col-start-3 row-start-2" },
  { action: "down", icon: "↓", label: "Move down", position: "col-start-2 row-start-3" }
];

export function ControlPanel({
  controlsDisabled,
  isStarting,
  onReset,
  onStart,
  onStep
}: ControlPanelProps) {
  useEffect(() => {
    if (controlsDisabled) {
      return;
    }

    const keyToAction: Record<string, Action> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right"
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = keyToAction[event.key];

      if (!action || event.repeat) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      void onStep(action);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [controlsDisabled, onStep]);

  return (
    <section className="rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(4,10,22,0.9),rgba(2,6,18,0.98))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.34)] backdrop-blur-xl">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.26em] text-slate-500">Control panel</p>
          <p className="text-[1.02rem] leading-7 text-slate-300">Directional input with keyboard support and a tighter command surface.</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onStart}
            className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-base font-medium text-cyan-100 transition-all duration-[200ms] ease-out hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:text-white hover:shadow-[0_0_22px_rgba(34,211,238,0.2)] active:translate-y-[1px] active:scale-[0.98]"
            disabled={isStarting}
          >
            {isStarting ? "Starting..." : "Start"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-base font-medium text-slate-200 transition-all duration-[200ms] ease-out hover:border-cyan-300/30 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_0_18px_rgba(34,211,238,0.12)] active:translate-y-[1px] active:scale-[0.98]"
            disabled={isStarting}
          >
            {isStarting ? "Syncing..." : "Reset"}
          </button>
        </div>

        <div className="rounded-[1.2rem] border border-cyan-300/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="grid grid-cols-3 gap-4">
          {ACTION_BUTTONS.map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => onStep(item.action)}
              disabled={controlsDisabled}
              aria-label={item.label}
              title={item.label}
              className={[
                item.position,
                "group relative flex h-16 w-16 items-center justify-center rounded-xl border border-cyan-300/18 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.18),rgba(15,23,42,0.98)_62%)] text-[1.8rem] font-semibold text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(2,12,27,0.26)] transition-all duration-[200ms] ease-out hover:scale-[1.06] hover:border-cyan-300/55 hover:text-white hover:shadow-[0_0_26px_rgba(34,211,238,0.34),0_14px_28px_rgba(8,47,73,0.42)] active:scale-[0.92] active:translate-y-[1px] disabled:scale-100 disabled:opacity-40"
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-cyan-300/0 opacity-0 blur-md transition-all duration-[200ms] group-hover:bg-cyan-300/12 group-hover:opacity-100 group-active:opacity-75" />
              <span className="relative transition-transform duration-[200ms] group-hover:scale-110 group-active:scale-95">
                {item.icon}
              </span>
            </button>
          ))}
        </div>
        </div>

        <p className="text-[0.75rem] uppercase tracking-[0.2em] text-slate-500">Arrow keys enabled</p>
      </div>
    </section>
  );
}
