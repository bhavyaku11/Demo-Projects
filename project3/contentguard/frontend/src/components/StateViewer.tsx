import { useState } from "react";
import type { EnvironmentState } from "../types";

interface StateViewerProps {
  state: Record<string, unknown> | EnvironmentState | null;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function colorizeJson(obj: Record<string, unknown> | EnvironmentState | null) {
  if (!obj) {
    return `<span class="json-str">No environment state available yet.</span>`;
  }

  const json = JSON.stringify(obj, null, 2);
  const escaped = escapeHtml(json);

  return escaped.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let className = "json-num";
      if (/^"/.test(match)) {
        className = /:$/.test(match) ? "json-key" : "json-str";
      } else if (/true|false|null/.test(match)) {
        className = "json-bool";
      }
      return `<span class="${className}">${match}</span>`;
    },
  );
}

export function StateViewer({ state }: StateViewerProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="state-viewer">
      <div className="state-viewer-header">
        <div className="panel-title">State Viewer</div>
        <button type="button" className="state-toggle" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!collapsed ? <pre className="state-json" dangerouslySetInnerHTML={{ __html: colorizeJson(state) }} /> : null}
    </section>
  );
}
