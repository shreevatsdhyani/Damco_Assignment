"use client";

import { AlertTriangle, XCircle, Info, Shield } from "lucide-react";
import type { HealthScoreResponse, BriefingRisk } from "../types";

interface RiskPanelProps {
  risks: BriefingRisk[];
  alerts: HealthScoreResponse["alerts"];
  loading: boolean;
}

export default function RiskPanel({ risks, alerts, loading }: RiskPanelProps) {
  if (loading) {
    return (
      <div className="h-full flex flex-col p-4 overflow-y-auto" style={{ background: 'var(--bg-app)' }}>
        <div className="h-4 w-24 rounded animate-pulse mb-4" style={{ background: 'var(--bg-card)' }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-lg mb-2 animate-pulse" style={{ background: 'var(--bg-card)' }} />
        ))}
      </div>
    );
  }

  const allItems = [
    ...risks.map(r => ({ ...r, type: "risk" as const })),
    ...alerts.filter(a => a.severity !== "info").map(a => ({
      severity: a.severity as "critical" | "warning",
      title: a.message,
      detail: a.category,
      type: "alert" as const,
    })),
  ];

  const critical = allItems.filter(i => i.severity === "critical");
  const warnings = allItems.filter(i => i.severity === "warning");
  const infos = alerts.filter(a => a.severity === "info");

  const getIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--status-critical)' }} />;
      case "warning": return <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--status-warning)' }} />;
      default: return <Info className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-secondary)' }} />;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case "critical": return 'var(--status-critical)';
      case "warning": return 'var(--status-warning)';
      default: return 'var(--border-subtle)';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ background: 'var(--bg-app)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" style={{ color: 'var(--status-warning)' }} />
          <h2 className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
            Risk Monitor
          </h2>
        </div>
        <div className="flex gap-3 mt-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `color-mix(in srgb, var(--status-critical) 20%, transparent)`, color: 'var(--status-critical)' }}>
            {critical.length} Critical
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `color-mix(in srgb, var(--status-warning) 20%, transparent)`, color: 'var(--status-warning)' }}>
            {warnings.length} Warning
          </span>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {allItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <Shield className="w-10 h-10 mb-2" style={{ color: 'var(--status-healthy)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--status-healthy)' }}>All Clear</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>No risks detected</p>
          </div>
        )}

        {critical.map((item, i) => (
          <div
            key={`c-${i}`}
            className="p-3 rounded-lg border-l-2"
            style={{ background: 'var(--bg-card)', borderLeftColor: getBorderColor(item.severity) }}
          >
            <div className="flex items-start gap-2">
              {getIcon(item.severity)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                {item.detail && item.type === "risk" && (
                  <p className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.detail}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {warnings.map((item, i) => (
          <div
            key={`w-${i}`}
            className="p-3 rounded-lg border-l-2"
            style={{ background: 'var(--bg-card)', borderLeftColor: getBorderColor(item.severity) }}
          >
            <div className="flex items-start gap-2">
              {getIcon(item.severity)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                {item.detail && item.type === "risk" && (
                  <p className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.detail}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {infos.map((item, i) => (
          <div
            key={`i-${i}`}
            className="p-2.5 rounded-lg"
            style={{ background: 'var(--bg-card)' }}
          >
            <div className="flex items-start gap-2">
              {getIcon("info")}
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
