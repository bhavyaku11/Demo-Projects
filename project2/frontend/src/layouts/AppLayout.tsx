import { Outlet } from "react-router-dom";

import { Navbar } from "@/components/navigation/Navbar";

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-brand-bg">
      <div className="pointer-events-none absolute inset-0 bg-brand-mesh opacity-80" />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-violet-500/18 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-500/12 blur-3xl" />
      <div className="relative flex min-h-screen w-full flex-1 flex-col">
        <Navbar />
        <main className="flex h-full min-h-screen w-full flex-1 px-6 py-6 md:px-10 md:py-10 lg:px-16 lg:py-12">
          <div className="min-w-0 w-full h-full transition-all duration-500 ease-out">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
