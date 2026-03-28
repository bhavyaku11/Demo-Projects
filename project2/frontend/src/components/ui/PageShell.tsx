import type { PropsWithChildren } from "react";

interface PageShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
}

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <div className="layout-container flex min-h-screen flex-col py-8 sm:py-10">
      <header className="dashboard-card max-w-5xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="eyebrow-chip">{eyebrow}</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-6xl">
              <span className="text-gradient-brand">{title}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-brand-muted sm:text-lg">{description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="stat-tile min-w-[180px]">
              <p className="section-label">Theme</p>
              <p className="mt-3 text-lg font-semibold text-white">Midnight Glass</p>
            </div>
            <div className="stat-tile min-w-[180px]">
              <p className="section-label">System</p>
              <p className="mt-3 text-lg font-semibold text-white">SaaS Dashboard UI</p>
            </div>
          </div>
        </div>
        <div className="divider-glow mt-8" />
      </header>
      <main className="mt-8 flex-1">{children}</main>
    </div>
  );
}
