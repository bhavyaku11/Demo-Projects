import type { EnvironmentState } from "../types/environment";

interface StatsPanelProps {
  rewardsCollected: number;
  simulation: EnvironmentState | null;
}

export function StatsPanel({ rewardsCollected, simulation }: StatsPanelProps) {
  return (
    <section className="rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,12,26,0.86),rgba(2,6,18,0.98))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.34)] backdrop-blur-xl">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.26em] text-slate-500">Stats panel</p>
          <p className="text-[1.02rem] leading-7 text-slate-300">Live performance markers arranged for quick scanning during the run.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatTile label="Score" value={String(simulation?.score ?? 0)} accent="text-emerald-200" />
          <StatTile label="Steps" value={String(simulation?.steps ?? 0)} accent="text-cyan-200" />
          <StatTile label="Rewards collected" value={String(rewardsCollected)} accent="text-slate-100" />
          <StatTile label="Status" value={simulation?.status ?? "idle"} accent="text-cyan-100" />
        </div>
      </div>
    </section>
  );
}

function StatTile({
  accent,
  label,
  value
}: {
  accent: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-[200ms] ease-out hover:border-white/14 hover:bg-white/[0.05]">
      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-3 text-[1.72rem] font-semibold tracking-tight text-white ${accent}`}>{value}</p>
    </div>
  );
}
