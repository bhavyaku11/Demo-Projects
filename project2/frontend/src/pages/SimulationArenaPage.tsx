import { ControlPanel } from "@/features/simulation/components/ControlPanel";
import { GameGrid } from "@/features/simulation/components/GameGrid";
import { StatsPanel } from "@/features/simulation/components/StatsPanel";
import { useGame } from "@/features/simulation/hooks/useGame";

const SHOWCASE_GRID_SIZE = 10;

export function SimulationArenaPage() {
  const {
    arenaState,
    isBootstrapping,
    isStarting,
    isMoving,
    resetGame,
    rewardsCollected,
    simulation,
    startGame,
    moveAgent
  } = useGame();

  const controlsDisabled = !simulation || simulation.status !== "running" || isMoving || isStarting;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 px-6 py-8 md:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(3,7,18,1))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.08),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.11),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)] opacity-40" />

      <div className="relative z-10 flex flex-col gap-10">
        <header className="max-w-4xl space-y-4">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/75">Simulation arena</p>
          <h1 className="max-w-3xl text-[2.65rem] font-semibold tracking-tight text-white sm:text-[3.1rem]">
            Command the live game grid.
          </h1>
          <p className="max-w-3xl text-[1.02rem] leading-8 text-slate-300 sm:text-[1.08rem]">
            A premium command surface with the board as the focal point and a tighter support rail for movement and live run data.
          </p>
        </header>

        <main className="grid grid-cols-1 items-start gap-10 xl:grid-cols-[2.5fr_1fr] xl:items-center">
          <GameGrid arenaState={arenaState} isBootstrapping={isBootstrapping} />

          <div className="flex h-full w-full flex-col gap-6 xl:max-w-[25rem] xl:justify-self-end">
            <ControlPanel
              controlsDisabled={controlsDisabled}
              isStarting={isStarting}
              onReset={() => resetGame(SHOWCASE_GRID_SIZE)}
              onStart={() => startGame(SHOWCASE_GRID_SIZE)}
              onStep={moveAgent}
            />
            <StatsPanel
              rewardsCollected={rewardsCollected}
              simulation={simulation}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
