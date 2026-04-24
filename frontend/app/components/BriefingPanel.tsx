"use client";

import { TrendingUp, AlertTriangle, Shield, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { BriefingResponse, HealthScoreResponse, DashboardResponse } from "../types";

interface BriefingPanelProps {
  briefing: BriefingResponse | null;
  healthScore: HealthScoreResponse | null;
  dashboard: DashboardResponse | null;
  loading: boolean;
}

export default function BriefingPanel({ briefing, healthScore, dashboard, loading }: BriefingPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("metrics");

  const toggle = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col p-4 overflow-y-auto" style={{ background: 'var(--bg-app)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: 'var(--bg-card)' }} />
          <div className="flex-1">
            <div className="h-4 w-32 rounded animate-pulse mb-1" style={{ background: 'var(--bg-card)' }} />
            <div className="h-3 w-48 rounded animate-pulse" style={{ background: 'var(--bg-card)' }} />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-lg mb-3 animate-pulse" style={{ background: 'var(--bg-card)' }} />
        ))}
      </div>
    );
  }

  if (!briefing && !dashboard) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg-app)' }}>
        <Shield className="w-12 h-12 mb-3" style={{ color: 'var(--text-disabled)' }} />
        <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
          Upload files to receive your executive briefing
        </p>
      </div>
    );
  }

  const kpis = dashboard?.kpis || [];
  const healthBreakdown = dashboard?.health_breakdown || "";
  const recommendations = dashboard?.recommendations || briefing?.recommendations || [];

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ background: 'var(--bg-app)' }}>
      {/* Briefing Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
            <Shield className="w-4 h-4" style={{ color: 'var(--text-on-accent)' }} />
          </div>
          <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: 'var(--accent-primary)' }}>
            Executive Briefing
          </h2>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {briefing?.summary || "Your AI CFO has analyzed the uploaded data."}
        </p>
      </div>

      {/* Key Metrics — from dynamic dashboard KPIs */}
      {kpis.length > 0 && (
        <div className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => toggle("metrics")}
            className="w-full px-4 py-3 flex items-center justify-between"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-xs font-bold uppercase tracking-wide">Key Metrics</span>
            </div>
            {expandedSection === "metrics" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSection === "metrics" && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {kpis.map((kpi, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 border"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {kpi.title}
                  </div>
                  <div className="text-lg font-bold font-mono" style={{ color: 'var(--accent-primary)' }}>
                    {kpi.value}
                  </div>
                  {kpi.trend && (
                    <div
                      className="text-[10px] mt-0.5 font-medium"
                      style={{
                        color: kpi.trend.startsWith("+") || kpi.trend.startsWith("↑")
                          ? 'var(--status-healthy)'
                          : kpi.trend.startsWith("-") || kpi.trend.startsWith("↓")
                            ? 'var(--status-critical)'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {kpi.trend}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fallback: legacy briefing metrics */}
      {kpis.length === 0 && briefing && briefing.key_metrics.length > 0 && (
        <div className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => toggle("metrics")}
            className="w-full px-4 py-3 flex items-center justify-between"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-xs font-bold uppercase tracking-wide">Key Metrics</span>
            </div>
            {expandedSection === "metrics" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSection === "metrics" && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {briefing.key_metrics.map((metric, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 border"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: metric.status === "critical" ? 'var(--status-critical)' :
                      metric.status === "warning" ? 'var(--status-warning)' : 'var(--border-subtle)',
                  }}
                >
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {metric.label}
                  </div>
                  <div className="text-lg font-bold font-mono" style={{ color: 'var(--accent-primary)' }}>
                    {metric.formatted}
                  </div>
                  {metric.sublabel && (
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {metric.sublabel}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Health Breakdown — dynamic from LLM */}
      {(healthBreakdown || healthScore) && (
        <div className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => toggle("health")}
            className="w-full px-4 py-3 flex items-center justify-between"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: 'var(--status-healthy)' }} />
              <span className="text-xs font-bold uppercase tracking-wide">Health Breakdown</span>
            </div>
            {expandedSection === "health" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSection === "health" && (
            <div className="px-4 pb-4 space-y-2">
              {healthBreakdown && (
                <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  {healthBreakdown}
                </div>
              )}
              {healthScore && Object.entries(healthScore.breakdown).map(([key, item]) => {
                const barColor = item.score >= 80 ? 'var(--status-healthy)' :
                  item.score >= 60 ? 'var(--status-warning)' : 'var(--status-critical)';
                return (
                  <div key={key} className="rounded-lg p-3" style={{ background: 'var(--bg-card)' }}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span className="font-mono font-bold" style={{ color: barColor }}>{item.score}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border-subtle)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${item.score}%`, background: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recommendations — dynamic */}
      {recommendations.length > 0 && (
        <div className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => toggle("recommendations")}
            className="w-full px-4 py-3 flex items-center justify-between"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" style={{ color: 'var(--status-warning)' }} />
              <span className="text-xs font-bold uppercase tracking-wide">Recommendations</span>
            </div>
            {expandedSection === "recommendations" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSection === "recommendations" && (
            <div className="px-4 pb-4 space-y-2">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex gap-2 text-xs p-3 rounded-lg"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                >
                  <span className="font-bold flex-shrink-0" style={{ color: 'var(--accent-primary)' }}>{i + 1}.</span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />
    </div>
  );
}
