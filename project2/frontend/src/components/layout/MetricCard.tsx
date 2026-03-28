interface MetricCardProps {
  label: string;
  value: string;
  delta: string;
}

export function MetricCard({ label, value, delta }: MetricCardProps) {
  return (
    <article className="h-full w-full rounded-[30px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_18px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-white/[0.07] sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-6 text-[2rem] font-semibold tracking-tight text-white sm:text-[2.25rem]">{value}</p>
      <p className="mt-4 text-sm leading-7 text-cyan-200">{delta}</p>
    </article>
  );
}
