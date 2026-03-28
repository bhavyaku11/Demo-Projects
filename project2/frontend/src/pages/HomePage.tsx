import { Link } from "react-router-dom";

import { APP_NAME } from "@scalar/shared";

import { GamePanel } from "@/features/game/components/GamePanel";
import { HealthPanel } from "@/features/system/components/HealthPanel";

import { MetricCard } from "@/components/layout/MetricCard";
import { PageIntro } from "@/components/layout/PageIntro";

export function HomePage() {
  return (
    <div className="space-y-10 lg:space-y-12">
      <PageIntro
        badge="Home"
        title={APP_NAME}
        description="A polished application shell with restrained motion, strong hierarchy, and responsive dashboard composition inspired by Stripe, Linear, and Vercel."
        actions={
          <>
            <Link
              to="/simulation-arena"
              className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition-all duration-300 hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:text-white"
            >
              Open Arena
            </Link>
            <Link
              to="/results-dashboard"
              className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              View Reports
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 xl:grid-cols-3">
        <MetricCard label="Active environments" value="03" delta="Core routes ready for scale" />
        <MetricCard label="UI latency" value="16ms" delta="Smooth nav and hover response" />
        <MetricCard label="Build status" value="Stable" delta="Responsive shell across breakpoints" />
      </section>

      <div className="grid grid-cols-1 items-stretch gap-8 xl:grid-cols-2">
        <GamePanel />
        <HealthPanel />
      </div>
    </div>
  );
}
