import { useEffect, useRef, useState } from "react";

import type { ArenaGameStateResponse, Position } from "../types/environment";

interface GameGridProps {
  arenaState: ArenaGameStateResponse;
  isBootstrapping: boolean;
}

const GRID_SIZE = 10;

export function GameGrid({ arenaState, isBootstrapping }: GameGridProps) {
  const previousAgentRef = useRef<Position | null>(null);
  const [highlightedCell, setHighlightedCell] = useState<Position | null>(null);
  const [isHighlightVisible, setIsHighlightVisible] = useState(false);
  const agentPosition = {
    row: arenaState.agent.y,
    col: arenaState.agent.x
  };
  const hasActiveRun = arenaState.status !== "idle";

  useEffect(() => {
    if (!hasActiveRun) {
      previousAgentRef.current = null;
      setHighlightedCell(null);
      setIsHighlightVisible(false);
      return;
    }

    const previous = previousAgentRef.current;
    const current = agentPosition;

    if (!previous) {
      previousAgentRef.current = current;
      return;
    }

    if (previous.row === current.row && previous.col === current.col) {
      return;
    }

    previousAgentRef.current = current;
    setHighlightedCell(current);
    setIsHighlightVisible(true);

    const timeoutId = window.setTimeout(() => {
      setIsHighlightVisible(false);
    }, 240);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [agentPosition, hasActiveRun]);

  return (
    <div className="flex w-full justify-center xl:justify-start">
      <div className="w-full max-w-[46rem] space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div className="space-y-2">
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/75">Live board</p>
            <h2 className="text-[1.55rem] font-semibold tracking-tight text-white sm:text-[1.75rem]">10x10 Simulation Grid</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-slate-400 shadow-[0_12px_30px_rgba(2,6,23,0.2)] backdrop-blur-md">
            {hasActiveRun ? `${arenaState.status} run` : "ready state"}
          </div>
        </div>

        <div className="relative aspect-square w-full [--grid-gap:0.25rem] [--grid-padding:0.25rem] sm:[--grid-gap:0.375rem] sm:[--grid-padding:0.375rem]">
          <div className="pointer-events-none absolute inset-[-3%] rounded-[2.2rem] bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-[8%] top-[-5%] h-28 rounded-full bg-cyan-300/14 blur-3xl" />
          <div className="pointer-events-none absolute inset-[-1%] rounded-[2rem] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(7,15,30,0.9),rgba(3,8,20,0.9))] shadow-[0_0_70px_rgba(34,211,238,0.12),0_36px_110px_rgba(2,12,27,0.58)]" />
          <div className="pointer-events-none absolute inset-0 rounded-[1.9rem] bg-[radial-gradient(circle_at_50%_10%,rgba(34,211,238,0.2),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.12),transparent_24%)]" />
          <div className="pointer-events-none absolute inset-[2.2%] rounded-[1.6rem] border border-white/7" />

          <div className="absolute inset-0 p-[var(--grid-padding)]">
            <div className="relative h-full w-full overflow-hidden rounded-[1.45rem] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(9,17,31,0.98),rgba(5,10,22,0.99))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1),transparent_58%)]" />
              <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />

              <div className="absolute inset-0 p-[var(--grid-padding)]">
                <div className="relative grid h-full w-full grid-cols-10 gap-[var(--grid-gap)]">
                  {(arenaState.grid.length ? arenaState.grid : createEmptyGrid()).flatMap((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <Cell key={`${rowIndex}-${colIndex}`} cell={cell} />
                    ))
                  )}
                </div>

                {highlightedCell ? (
                  <div className="pointer-events-none absolute z-[8]" style={gridCellStyle(highlightedCell)}>
                    <div
                      className={[
                        "relative h-full w-full rounded-[0.95rem] border border-cyan-200/70 bg-cyan-300/14 shadow-[0_0_0_1px_rgba(103,232,249,0.16),0_0_24px_rgba(34,211,238,0.34)] transition-all duration-[200ms] ease-out",
                        isHighlightVisible ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"
                      ].join(" ")}
                    />
                  </div>
                ) : null}

                {!hasActiveRun ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="max-w-sm space-y-3 px-6 text-center">
                      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Game grid</p>
                      <p className="text-[1.45rem] font-semibold tracking-tight text-white">
                        {isBootstrapping ? "Restoring live board..." : "Start a run to load the 10x10 arena"}
                      </p>
                      <p className="text-sm leading-7 text-slate-400">
                        The board will illuminate with live agent movement, rewards, and obstacles once the arena starts.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ cell }: { cell: number }) {
  const isAgent = cell === 1;
  const isObstacle = cell === 2;
  const isReward = cell === 3;

  return (
    <div
      className={[
        "relative aspect-square overflow-hidden rounded-[0.85rem] border transition-all duration-[200ms] ease-out hover:brightness-110",
        isAgent
          ? "border-cyan-100/60 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.98),rgba(103,232,249,0.84)_25%,rgba(6,182,212,0.98)_65%,rgba(8,47,73,0.98)_100%)] shadow-[0_0_0_1px_rgba(103,232,249,0.22),0_0_24px_rgba(34,211,238,0.56),0_12px_24px_rgba(14,116,144,0.34)]"
          : isObstacle
          ? "border-red-300/22 bg-[linear-gradient(145deg,rgba(248,113,113,0.92),rgba(127,29,29,0.94))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_18px_rgba(127,29,29,0.28)]"
          : isReward
            ? "border-emerald-300/28 bg-[linear-gradient(145deg,rgba(74,222,128,0.98),rgba(21,128,61,0.94))] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_18px_rgba(22,163,74,0.22)]"
            : "border-white/6 bg-[linear-gradient(145deg,rgba(23,37,64,0.84),rgba(15,23,42,0.98))] hover:border-cyan-300/16 hover:bg-[linear-gradient(145deg,rgba(30,41,59,0.92),rgba(15,23,42,1))] hover:shadow-[0_0_18px_rgba(34,211,238,0.08)]"
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_38%,transparent_70%,rgba(255,255,255,0.02))]" />
      {isObstacle ? (
        <>
          <div className="absolute inset-x-[22%] top-[18%] h-[2px] rotate-45 rounded-full bg-white/35" />
          <div className="absolute inset-x-[22%] top-[18%] h-[2px] -rotate-45 rounded-full bg-white/24" />
        </>
      ) : null}
      {isReward ? (
        <>
          <div className="absolute inset-[24%] rounded-full border border-white/38 bg-white/18" />
          <div className="absolute inset-[34%] rounded-full bg-emerald-50/92 shadow-[0_0_18px_rgba(255,255,255,0.72)]" />
        </>
      ) : null}
      {isAgent ? (
        <>
          <div className="absolute inset-[-18%] rounded-[1rem] bg-cyan-300/24 blur-lg" />
          <div className="absolute inset-[28%] rounded-full border border-white/55 bg-white/28" />
        </>
      ) : null}
    </div>
  );
}

function gridCellStyle(position: Position) {
  const cellSize = "calc((100% - ((10 - 1) * var(--grid-gap))) / 10)";
  const cellWithGap = `calc(${cellSize} + var(--grid-gap))`;

  return {
    height: cellSize,
    width: cellSize,
    left: "var(--grid-padding)",
    top: "var(--grid-padding)",
    transform: `translate3d(calc(${cellWithGap} * ${position.col}), calc(${cellWithGap} * ${position.row}), 0)`
  };
}

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => 0));
}
