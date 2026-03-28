import { SectionCard } from "@/components/ui/SectionCard";

import { useHealth } from "../hooks/useHealth";

export function HealthPanel() {
  const { data, error, isLoading } = useHealth();
  const summary = error
    ? "API unreachable"
    : isLoading
      ? "Checking status"
      : data?.status === "ok"
        ? "Healthy"
        : "Unknown";

  return (
    <SectionCard
      title="Service Health"
      subtitle="Backend connectivity check using the modular health route."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <HealthStat label="Status" value={isLoading ? "loading" : data?.status ?? "offline"} />
        <HealthStat label="Environment" value={data?.environment ?? "unknown"} />
        <HealthStat label="Service" value={data?.service ?? "not connected"} />
        <HealthStat label="Uptime" value={data ? `${data.uptimeSeconds}s` : "0s"} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="panel-surface space-y-3 p-6 text-sm text-brand-muted">
          <p className="section-label">Last response</p>
          <p className="text-sm leading-7 text-brand-text">
            {error ? error : data?.timestamp ?? "Waiting for health response..."}
          </p>
        </div>

        <div className="panel-surface space-y-3 p-6">
          <p className="section-label">Connection summary</p>
          <p className="text-2xl font-semibold tracking-tight text-white">{summary}</p>
          <p className="text-sm leading-7 text-brand-muted">
            Health checks are loaded from the backend route and surfaced here so module status remains visible without opening a separate diagnostics page.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

interface HealthStatProps {
  label: string;
  value: string;
}

function HealthStat({ label, value }: HealthStatProps) {
  return (
    <div className="stat-tile h-full w-full p-6">
      <p className="section-label">{label}</p>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
