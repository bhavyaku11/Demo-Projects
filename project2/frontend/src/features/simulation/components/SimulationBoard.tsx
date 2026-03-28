import { useEffect, useRef, useState } from "react";

import type { CellType, Position } from "../types/environment";

interface SimulationBoardProps {
  agent: Position;
  cells: CellType[][];
  gridSize: number;
}

const AXIS_SIZE_REM = 2;
const GRID_PADDING_REM = 0.625;

export function SimulationBoard({ agent, cells, gridSize }: SimulationBoardProps) {
  const axisLabels = Array.from({ length: gridSize }, (_, index) => index + 1);
  const previousAgentRef = useRef<Position | null>(null);
  const [highlightedCell, setHighlightedCell] = useState<Position | null>(null);
  const [isHighlightVisible, setIsHighlightVisible] = useState(false);

  useEffect(() => {
    const previous = previousAgentRef.current;

    if (!previous) {
      previousAgentRef.current = agent;
      return;
    }

    if (previous.row === agent.row && previous.col === agent.col) {
      return;
    }

    previousAgentRef.current = agent;
    setHighlightedCell(agent);
    setIsHighlightVisible(true);

    const timeoutId = window.setTimeout(() => {
      setIsHighlightVisible(false);
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [agent]);

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[54rem] flex-col justify-center overflow-hidden rounded-[2rem] border border-cyan-300/[0.12] bg-[linear-gradient(180deg,rgba(7,14,29,0.98),rgba(3,8,20,0.98))] p-4 shadow-[0_34px_120px_rgba(2,12,27,0.62)] sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-[14%] top-0 h-28 rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="absolute -left-12 top-1/4 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-3 rounded-[30px] border border-white/6" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_34%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.08),transparent_26%)]" />
      </div>

      <div className="relative z-10 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-cyan-200/[0.72]">Simulation arena</p>
            <h3 className="mt-1 text-[1.55rem] font-semibold tracking-tight text-white sm:text-[1.85rem]">
              10x10 Neon Grid
            </h3>
          </div>

          <div className="rounded-full border border-cyan-300/16 bg-cyan-400/[0.08] px-4 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-cyan-100">
            {gridSize}x{gridSize} active board
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[38rem] rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,34,0.96),rgba(4,9,22,0.98))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_80px_rgba(2,12,27,0.55)] sm:max-w-[42rem] sm:p-4 lg:max-w-[46rem] lg:p-5 xl:max-w-[48rem]">
          <div className="pointer-events-none absolute inset-0 rounded-[1.85rem] bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.1),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-cyan-300/10" />
          <div className="pointer-events-none absolute inset-6 rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_28%,transparent_72%,rgba(255,255,255,0.02))]" />

          <div className="relative h-full w-full [--board-gap:0.25rem] sm:[--board-gap:0.4rem] lg:[--board-gap:0.5rem]">
            <AxisRow gridSize={gridSize} labels={axisLabels} />
            <AxisColumn gridSize={gridSize} labels={axisLabels} />
            <AxisColumn gridSize={gridSize} labels={axisLabels} right />
            <AxisRow gridSize={gridSize} labels={axisLabels} bottom />

            <div
              className="absolute"
              style={{
                left: `${AXIS_SIZE_REM}rem`,
                right: `${AXIS_SIZE_REM}rem`,
                top: `${AXIS_SIZE_REM}rem`,
                bottom: `${AXIS_SIZE_REM}rem`
              }}
            >
              <div
                className="relative h-full w-full overflow-hidden rounded-[1.35rem] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(8,15,28,0.96),rgba(4,10,22,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                style={{ padding: `${GRID_PADDING_REM}rem` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:10%_10%] opacity-55" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_60%)]" />

                <div
                  className="relative grid h-full w-full grid-cols-10 grid-rows-10 gap-[var(--board-gap)]"
                >
                  {cells.flatMap((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <Cell key={`${rowIndex}-${colIndex}`} cell={cell} />
                    ))
                  )}
                </div>

                {highlightedCell ? (
                  <div
                    className="pointer-events-none absolute z-[8]"
                    style={gridCellStyle(highlightedCell, gridSize)}
                  >
                    <div
                      className={[
                        "relative h-full w-full rounded-[1.1rem] border border-cyan-200/70 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(103,232,249,0.16),0_0_28px_rgba(34,211,238,0.35)] transition-all duration-[250ms] ease-out",
                        isHighlightVisible ? "scale-100 opacity-100" : "scale-[1.12] opacity-0"
                      ].join(" ")}
                    >
                      <div className="absolute inset-[14%] rounded-[0.85rem] border border-cyan-100/35 bg-cyan-100/10" />
                    </div>
                  </div>
                ) : null}

                <div
                  className="pointer-events-none absolute z-10"
                  style={agentStyle(agent, gridSize)}
                >
                  <div className="relative h-full w-full transition-transform duration-[260ms] ease-out">
                    <div className="absolute inset-[-20%] rounded-[1.45rem] bg-cyan-300/20 blur-xl transition-all duration-[260ms]" />
                    <div className="absolute inset-[8%] rounded-[1.1rem] border border-cyan-100/70 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(103,232,249,0.78)_25%,rgba(6,182,212,0.95)_65%,rgba(8,47,73,0.95)_100%)] shadow-[0_0_0_1px_rgba(103,232,249,0.2),0_0_32px_rgba(34,211,238,0.65),0_18px_36px_rgba(14,116,144,0.45)] transition-all duration-[260ms]" />
                    <div className="absolute inset-[26%] rounded-full border border-white/50 bg-white/28" />
                    <div className="absolute inset-[38%] rounded-full bg-cyan-50 shadow-[0_0_18px_rgba(255,255,255,0.9)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ cell }: { cell: CellType }) {
  const isObstacle = cell === "obstacle";
  const isReward = cell === "reward";

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[1rem] border shadow-[0_0_18px_rgba(15,23,42,0.18)] transition-all duration-[250ms] ease-out",
        isObstacle
          ? "border-red-300/24 bg-[linear-gradient(145deg,rgba(248,113,113,0.9),rgba(127,29,29,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_28px_rgba(127,29,29,0.3)]"
          : isReward
            ? "border-emerald-300/30 bg-[linear-gradient(145deg,rgba(74,222,128,0.95),rgba(21,128,61,0.95))] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_12px_28px_rgba(22,163,74,0.26)]"
            : "border-white/6 bg-[linear-gradient(145deg,rgba(23,37,64,0.78),rgba(15,23,42,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-cyan-300/16 hover:bg-[linear-gradient(145deg,rgba(30,41,59,0.92),rgba(15,23,42,0.98))]"
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_35%,transparent_65%,rgba(255,255,255,0.02))]" />
      <div
        className={[
          "absolute inset-[2px] rounded-[0.8rem] border",
          isObstacle
            ? "border-red-100/10"
            : isReward
              ? "border-emerald-100/14"
              : "border-white/4"
        ].join(" ")}
      />

      {isObstacle ? (
        <>
          <div className="absolute inset-x-[22%] top-[18%] h-[2px] rotate-45 rounded-full bg-white/35" />
          <div className="absolute inset-x-[22%] top-[18%] h-[2px] -rotate-45 rounded-full bg-white/24" />
        </>
      ) : null}

      {isReward ? (
        <>
          <div className="absolute inset-[24%] rounded-full border border-white/38 bg-white/18" />
          <div className="absolute inset-[34%] rounded-full bg-emerald-50/92 shadow-[0_0_20px_rgba(255,255,255,0.78)]" />
          <div className="absolute inset-[16%] animate-pulse rounded-full border border-emerald-100/18" />
        </>
      ) : null}
    </div>
  );
}

function AxisRow({
  bottom,
  gridSize,
  labels
}: {
  bottom?: boolean;
  gridSize: number;
  labels: number[];
}) {
  return (
    <div
      className="absolute flex items-center"
      style={{
        left: `${AXIS_SIZE_REM}rem`,
        right: `${AXIS_SIZE_REM}rem`,
        height: `${AXIS_SIZE_REM}rem`,
        bottom: bottom ? 0 : undefined,
        top: bottom ? undefined : 0
      }}
    >
      <div
        className="grid h-full w-full"
        style={{
          gap: "var(--board-gap)",
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
        }}
      >
        {labels.map((label) => (
          <div
            key={`${bottom ? "bottom" : "top"}-${label}`}
            className="flex items-center justify-center text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function AxisColumn({
  gridSize,
  labels,
  right
}: {
  gridSize: number;
  labels: number[];
  right?: boolean;
}) {
  return (
    <div
      className="absolute flex items-center"
      style={{
        left: right ? undefined : 0,
        right: right ? 0 : undefined,
        top: `${AXIS_SIZE_REM}rem`,
        bottom: `${AXIS_SIZE_REM}rem`,
        width: `${AXIS_SIZE_REM}rem`
      }}
    >
      <div
        className="grid h-full w-full"
        style={{
          gap: "var(--board-gap)",
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
        }}
      >
        {labels.map((label) => (
          <div
            key={`${right ? "right" : "left"}-${label}`}
            className="flex items-center justify-center text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function agentStyle(agent: Position, gridSize: number) {
  return {
    ...gridCellStyle(agent, gridSize),
    transition: "transform 260ms ease-out"
  };
}

function gridCellStyle(position: Position, gridSize: number) {
  const cellSize = `calc((100% - ((${gridSize} - 1) * var(--board-gap))) / ${gridSize})`;
  const cellWithGap = `calc(${cellSize} + var(--board-gap))`;

  return {
    height: cellSize,
    width: cellSize,
    left: `${GRID_PADDING_REM}rem`,
    top: `${GRID_PADDING_REM}rem`,
    transform: `translate3d(calc(${cellWithGap} * ${position.col}), calc(${cellWithGap} * ${position.row}), 0)`
  };
}
