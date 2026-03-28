import { HealthPanel } from "@/features/system/components/HealthPanel";

import { MetricCard } from "@/components/layout/MetricCard";
import { PageIntro } from "@/components/layout/PageIntro";

export function ResultsDashboardPage() {
  return (
    <div className="space-y-10 lg:space-y-12">
      <PageIntro
        badge="Results Dashboard"
        title="Review performance with calm, high-signal reporting."
        description="A Stripe and Vercel inspired reporting surface with lightweight cards, clear hierarchy, and responsive composition for metrics and system insight."
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 xl:grid-cols-3">
        <MetricCard label="Completion rate" value="94.2%" delta="+3.8% week over week" />
        <MetricCard label="Best score" value="8 / 8" delta="Top percentile simulation outcome" />
        <MetricCard label="Median attempts" value="4.1" delta="-0.7 fewer attempts per run" />
        <MetricCard label="Throughput" value="1.2k" delta="Runs processed today" />
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Performance bands</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Scenario quality distribution</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">
              Updated 2m ago
            </div>
          </div>

          <div className="mt-10 space-y-6">
            {[
              { label: "Excellent", width: "w-[82%]", value: "82%" },
              { label: "Stable", width: "w-[64%]", value: "64%" },
              { label: "Needs review", width: "w-[28%]", value: "28%" }
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800/80">
                  <div
                    className={`h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 ${item.width}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <HealthPanel />
      </div>
    </div>
  );
}
