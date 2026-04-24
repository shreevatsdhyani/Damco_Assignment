"use client";

import { useRef, useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { DashboardResponse } from "../types";

interface DynamicDashboardProps {
  dashboard: DashboardResponse;
}

const CHART_COLORS = [
  "#3b82f6",
  "#38bdf8",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a855f7",
  "#ec4899",
  "#f97316",
];

function getTrendIcon(trend?: string | null) {
  if (!trend) return null;
  if (trend.startsWith("+") || trend.startsWith("↑")) {
    return <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--status-healthy)" }} />;
  }
  if (trend.startsWith("-") || trend.startsWith("↓")) {
    return <TrendingDown className="w-3.5 h-3.5" style={{ color: "var(--status-critical)" }} />;
  }
  return <Minus className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />;
}

function getTrendColor(trend?: string | null): string {
  if (!trend) return "var(--text-secondary)";
  if (trend.startsWith("+") || trend.startsWith("↑")) return "var(--status-healthy)";
  if (trend.startsWith("-") || trend.startsWith("↓")) return "var(--status-critical)";
  return "var(--text-secondary)";
}

function DynamicChart({ chart }: { chart: DashboardResponse["charts"][0] }) {
  const { type, title, xAxisKey, yAxisKey, data } = chart;
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        setReady(true);
      }
    };
    check();
    if (!ready) {
      const timer = setInterval(check, 100);
      return () => clearInterval(timer);
    }
  }, [ready]);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: "var(--accent-primary)" }}>{title}</h3>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>No data available</p>
      </div>
    );
  }

  const commonProps = {
    data,
    margin: { top: 5, right: 20, left: 10, bottom: 5 },
  };

  return (
    <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--accent-primary)" }}>{title}</h3>
      <div ref={containerRef} style={{ width: "100%", height: 280 }}>
        {ready && <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieChart>
              <Pie
                data={data}
                dataKey={yAxisKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }: any) =>
                  `${(name || "").toString().slice(0, 15)}: ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                }}
              />
              <Legend
                wrapperStyle={{ color: "var(--text-secondary)", fontSize: 12 }}
              />
            </PieChart>
          ) : type === "line" ? (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey={xAxisKey} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                }}
              />
              <Line
                type="monotone"
                dataKey={yAxisKey}
                stroke="var(--accent-primary)"
                strokeWidth={2}
                dot={{ fill: "var(--accent-primary)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey={xAxisKey} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                }}
              />
              <Bar dataKey={yAxisKey} fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>}
      </div>
    </div>
  );
}

export default function DynamicDashboard({ dashboard }: DynamicDashboardProps) {
  const { kpis, charts, health_breakdown, recommendations } = dashboard;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6" style={{ background: "var(--bg-app)" }}>
      {/* KPI Ribbon */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.min(kpis.length, 6)}, 1fr)` }}
      >
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="rounded-xl p-5 border transition-all hover:-translate-y-0.5"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
              boxShadow: "0 2px 12px var(--shadow-card)",
            }}
          >
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              {kpi.title}
            </div>
            <div className="text-2xl font-bold font-mono mb-1" style={{ color: "var(--accent-primary)" }}>
              {kpi.value}
            </div>
            {kpi.trend && (
              <div className="flex items-center gap-1">
                {getTrendIcon(kpi.trend)}
                <span className="text-xs font-medium" style={{ color: getTrendColor(kpi.trend) }}>
                  {kpi.trend}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {charts.map((chart, i) => (
          <DynamicChart key={i} chart={chart} />
        ))}
      </div>

      {/* Health Breakdown */}
      {health_breakdown && (
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--accent-primary)" }}>
            Health Breakdown
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {health_breakdown}
          </p>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--accent-primary)" }}>
            Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="font-bold flex-shrink-0" style={{ color: "var(--accent-primary)" }}>
                  {i + 1}.
                </span>
                <span style={{ color: "var(--text-primary)" }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
