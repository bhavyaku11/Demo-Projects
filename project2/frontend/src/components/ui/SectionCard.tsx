import type { PropsWithChildren, ReactNode } from "react";

interface SectionCardProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <section className="dashboard-card h-full w-full p-8 sm:p-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <p className="section-label">Module</p>
          <h2 className="text-[1.9rem] font-semibold leading-tight text-white sm:text-[2.1rem]">{title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-brand-muted sm:text-base">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="mt-10">{children}</div>
    </section>
  );
}
