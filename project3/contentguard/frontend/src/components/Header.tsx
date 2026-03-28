import { Shield } from "lucide-react";

interface HeaderProps {
  apiHealthy: boolean;
}

export function Header({ apiHealthy }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">
          <Shield size={16} />
        </div>
        <div className="header-logo-text">
          Content<span>Guard</span>
        </div>
      </div>
      <div className="header-divider" />
      <div className="header-badge">OpenEnv × Meta × Scaler</div>
      <div className="header-spacer" />
      <div className={`status-dot ${apiHealthy ? "" : "offline"}`}>
        {apiHealthy ? "SYSTEM ONLINE" : "API OFFLINE"}
      </div>
    </header>
  );
}
