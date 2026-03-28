import { useEffect } from "react";

import type { Action } from "../types/environment";
import { useSimulation } from "../hooks/useSimulation";

import { SimulationBoard } from "./SimulationBoard";

const SHOWCASE_GRID_SIZE = 10;
const ACTION_BUTTONS: Array<{ action: Action; icon: string; label: string; position: string }> = [
  { action: "up", icon: "↑", label: "Move up", position: "col-start-2" },
  { action: "left", icon: "←", label: "Move left", position: "col-start-1 row-start-2" },
  { action: "right", icon: "→", label: "Move right", position: "col-start-3 row-start-2" },
  { action: "down", icon: "↓", label: "Move down", position: "col-start-2 row-start-3" }
];

export function SimulationPanel() {
  const {
    error,
    evaluation,
    isBootstrapping,
    isStarting,
    isStepping,
    message,
    resetSimulation,
    rewardsCollected,
    simulation,
    startSimulation,
    stepSimulation
  } = useSimulation();

  const totalRewards = simulation ? simulation.collectedRewards + simulation.rewards.length : 0;
  const controlsDisabled = !simulation || simulation.status !== "running" || isStepping || isStarting;

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
      void stepSimulation(action);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [controlsDisabled, stepSimulation]);

  return (
    <section className="flex h-full min-h-[calc(100vh-80px)] w-full flex-col justify-center rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_28px_80px_rgba(2,6,23,0.4)] backdrop-blur-xl md:p-8">
      <div className="flex h-full w-full flex-col justify-center gap-8 lg:gap-10">
        <div className="space-y-3">
          <p className="text-[0.8rem] font-semibold uppercase tracking-[0.24em] text-slate-500">Arena controls</p>
          <h2 className="text-[2.1rem] font-semibold leading-tight text-white sm:text-[2.35rem]">
            Grid simulation surface
          </h2>
          <p className="max-w-3xl text-base leading-8 text-slate-300 sm:text-[1.05rem]">
            A split-view arena with the board as the focal surface and a compact control rail for stats, movement, and legend context.
          </p>
        </div>

        <div className="flex h-full min-h-[calc(100vh-18rem)] w-full items-center justify-center">
          <div className="grid h-full w-full items-center gap-8 xl:grid-cols-[3fr_1.2fr]">
            <div className="flex min-h-[36rem] w-full items-center justify-center xl:min-h-[44rem]">
              <div className="flex h-full w-full items-center justify-center">
                {simulation ? (
                  <SimulationBoard
                    agent={simulation.agentPosition}
                    cells={simulation.cells}
                    gridSize={simulation.rows}
                  />
                ) : (
                  <EmptyBoard isBootstrapping={isBootstrapping} />
                )}
              </div>
            </div>

            <div className="w-full space-y-6 xl:max-w-[26rem] xl:justify-self-end">
              <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.32)] backdrop-blur-xl">
                <p className="text-[0.8rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Stats</p>
                <div className="grid grid-cols-2 gap-4">
                  <CompactStat label="Steps" value={String(simulation?.steps ?? 0)} accent="text-cyan-200" />
                  <CompactStat label="Score" value={String(simulation?.score ?? 0)} accent="text-emerald-200" />
                  <CompactStat label="Rewards" value={`${rewardsCollected}/${totalRewards}`} accent="text-slate-100" />
                  <CompactStat label="Status" value={simulation?.status ?? "idle"} accent="text-cyan-100" />
                </div>
                <p className="text-base leading-7 text-slate-400">
                  {simulation
                    ? `Run progress ${simulation.steps}/${simulation.maxSteps} with evaluation ${formatMetric(evaluation?.totalScore)}.`
                    : "Start a run to populate live arena stats."}
                </p>
              </div>

              <div className="space-y-6 rounded-xl border border-white/10 bg-slate-950/45 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.36)] backdrop-blur-xl">
                <p className="text-[0.8rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Controls</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => startSimulation(SHOWCASE_GRID_SIZE)}
                    className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-base font-medium text-cyan-100 shadow-[0_0_0_rgba(34,211,238,0)] transition-all duration-[250ms] ease-out hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:text-white hover:shadow-[0_0_26px_rgba(34,211,238,0.22)] active:translate-y-[1px] active:scale-[0.98]"
                    disabled={isStarting}
                  >
                    {isStarting ? "Starting..." : "Start Game"}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetSimulation(SHOWCASE_GRID_SIZE)}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-base font-medium text-slate-200 shadow-[0_0_0_rgba(34,211,238,0)] transition-all duration-[250ms] ease-out hover:border-cyan-300/30 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_0_22px_rgba(34,211,238,0.14)] active:translate-y-[1px] active:scale-[0.98]"
                    disabled={isStarting}
                  >
                    {isStarting ? "Syncing..." : "Reset"}
                  </button>
                </div>

                <div className="space-y-4 rounded-xl border border-cyan-400/[0.14] bg-cyan-400/[0.08] p-6">
                  <p className="text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-cyan-100/80">Instructions</p>
                  <p className="text-base leading-7 text-slate-200">
                    {simulation?.status === "running"
                      ? "Use the D-pad or your keyboard arrows to move one step at a time through the 10x10 arena."
                      : "Start or reset the 10x10 arena to activate the controls and load the current run state."}
                  </p>
                </div>

                <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
                  <p className="text-base leading-7 text-slate-200">{error ?? message}</p>
                </div>

                <div className="space-y-4">
                  <p className="text-center text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Movement
                  </p>
                  <div className="flex justify-center">
                    <div className="grid grid-cols-3 gap-3">
                      {ACTION_BUTTONS.map((item) => (
                        <button
                          key={item.action}
                          type="button"
                          onClick={() => stepSimulation(item.action)}
                          disabled={controlsDisabled}
                          aria-label={item.label}
                          title={item.label}
                          className={[
                            item.position,
                            "group relative flex h-14 w-14 items-center justify-center rounded-[1rem] border border-cyan-300/18 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.18),rgba(15,23,42,0.98)_62%)] text-[1.55rem] font-semibold text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(2,12,27,0.26)] transition-all duration-[220ms] ease-out hover:scale-[1.06] hover:border-cyan-300/55 hover:text-white hover:shadow-[0_0_26px_rgba(34,211,238,0.34),0_14px_28px_rgba(8,47,73,0.42)] active:scale-[0.92] active:translate-y-[1px] disabled:scale-100 disabled:opacity-40 sm:h-16 sm:w-16 sm:text-[1.8rem]"
                          ].join(" ")}
                        >
                          <span className="pointer-events-none absolute inset-0 rounded-[1rem] bg-cyan-300/0 opacity-0 blur-md transition-all duration-[220ms] group-hover:bg-cyan-300/12 group-hover:opacity-100 group-active:opacity-75 sm:rounded-[1.1rem]" />
                          <span className="relative transition-transform duration-[220ms] group-hover:scale-110 group-active:scale-95">
                            {item.icon}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-center text-[0.75rem] uppercase tracking-[0.2em] text-slate-500">
                    Arrow keys enabled
                  </p>
                </div>
              </div>

              <div className="space-y-6 rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.36)] backdrop-blur-xl">
                <p className="text-[0.8rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Legend</p>
                <div className="grid gap-4">
                  <LegendRow color="from-cyan-300 via-cyan-400 to-sky-500" label="Agent" description="Backend-controlled actor" />
                  <LegendRow color="from-red-500 to-rose-700" label="Obstacles" description="Blocked cells" />
                  <LegendRow color="from-emerald-400 to-green-600" label="Rewards" description="Collectible score nodes" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyBoard({ isBootstrapping }: { isBootstrapping: boolean }) {
  return (
    <div className="flex aspect-square h-full w-full items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-slate-950/45 p-6 shadow-[0_28px_80px_rgba(2,6,23,0.42)]">
      <div className="max-w-sm text-center">
        <p className="text-[0.8rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Environment</p>
        <p className="mt-4 text-[1.35rem] font-semibold text-white">
          {isBootstrapping ? "Restoring backend state..." : "No active game initialized."}
        </p>
        <p className="mt-3 text-base leading-7 text-slate-400">
          Start the 10x10 arena to fetch the first grid from the backend and enable movement controls.
        </p>
      </div>
    </div>
  );
}

function CompactStat({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_12px_32px_rgba(2,6,23,0.22)]">
      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-3 text-[1.6rem] font-semibold tracking-tight text-white ${accent}`}>{value}</p>
    </div>
  );
}

function formatMetric(value: number | undefined) {
  if (typeof value !== "number") {
    return "--";
  }

  return value.toFixed(2);
}

function LegendRow({
  color,
  description,
  label
}: {
  color: string;
  description: string;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-5">
      <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${color}`} />
      <div className="min-w-0">
        <p className="text-base font-semibold text-white">{label}</p>
        <p className="mt-1 text-base text-slate-400">{description}</p>
      </div>
    </div>
  );
}
