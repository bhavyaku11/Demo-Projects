import { NavLink } from "react-router-dom";

import { navigationItems } from "@/app/navigation";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/55 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 md:px-10 lg:px-16 xl:px-24">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 shadow-[0_10px_40px_rgba(59,130,246,0.25)]">
            <span className="text-sm font-semibold text-white">SP</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300/75">Platform</p>
            <p className="text-sm font-semibold text-slate-100">Scalar Simulation</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:flex">
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                [
                  "group relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ease-out",
                  isActive
                    ? "border border-cyan-400/20 bg-gradient-to-r from-white/[0.12] to-white/[0.08] text-white shadow-[0_10px_30px_rgba(34,211,238,0.08)]"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  <span
                    className={[
                      "pointer-events-none absolute inset-x-3 bottom-1 h-px origin-left rounded-full bg-gradient-to-r from-cyan-300/0 via-cyan-300/80 to-cyan-300/0 transition-all duration-300",
                      isActive ? "scale-x-100 opacity-100" : "scale-x-50 opacity-0 group-hover:scale-x-100 group-hover:opacity-70"
                    ].join(" ")}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            Live Workspace
          </div>
          <button className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:text-white hover:shadow-[0_14px_28px_rgba(34,211,238,0.14)]">
            Deploy Preview
          </button>
        </div>
      </div>

      <div className="flex w-full gap-2 overflow-x-auto px-4 pb-4 sm:px-6 md:hidden md:px-10 lg:px-16 xl:px-24">
        {navigationItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              [
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ease-out",
                isActive
                  ? "border-cyan-400/25 bg-white/10 text-white shadow-[0_10px_24px_rgba(34,211,238,0.08)]"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/15 hover:bg-white/[0.06] hover:text-slate-100"
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
