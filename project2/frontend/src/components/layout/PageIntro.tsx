import type { ReactNode } from "react";

interface PageIntroProps {
  badge: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageIntro({ badge, title, description, actions }: PageIntroProps) {
  return (
    <section className="w-full rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent p-6 shadow-[0_24px_80px_rgba(2,6,23,0.4)] backdrop-blur-xl transition-all duration-500 md:p-8">
      <div className="flex h-full w-full flex-col justify-between gap-8 lg:flex-row lg:items-center">
        <div className="w-full space-y-4">
          <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-cyan-200">
            {badge}
          </span>
          <h1 className="text-[2.35rem] font-semibold tracking-tight text-white sm:text-[2.85rem] lg:text-[3.4rem]">{title}</h1>
          <p className="max-w-[60rem] text-base leading-8 text-slate-300 sm:text-[1.05rem] lg:text-[1.1rem]">{description}</p>
        </div>
        {actions ? <div className="flex w-full flex-wrap gap-4 lg:w-auto lg:justify-end lg:gap-5">{actions}</div> : null}
      </div>
    </section>
  );
}
