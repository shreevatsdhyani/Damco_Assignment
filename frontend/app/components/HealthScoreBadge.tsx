"use client";

import { useEffect, useState } from "react";
import type { HealthScoreResponse } from "../types";

interface HealthScoreBadgeProps {
  healthScore: HealthScoreResponse | null;
  loading?: boolean;
}

export default function HealthScoreBadge({ healthScore, loading }: HealthScoreBadgeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!healthScore) return;
    let current = 0;
    const target = healthScore.score;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setAnimatedScore(current);
    }, 30);
    return () => clearInterval(interval);
  }, [healthScore]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
        <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--text-disabled)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Calculating...</span>
      </div>
    );
  }

  if (!healthScore) return null;

  const getScoreColor = () => {
    if (healthScore.score >= 80) return 'var(--status-healthy)';
    if (healthScore.score >= 60) return 'var(--status-warning)';
    return 'var(--status-critical)';
  };

  const color = getScoreColor();
  const alertCount = healthScore.alerts.filter(a => a.severity !== "info").length;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
        style={{ background: 'var(--bg-card)', borderColor: color }}
      >
        <div className="relative w-8 h-8">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray={`${animatedScore * 0.88} 88`}
              strokeLinecap="round"
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
            style={{ color }}
          >
            {healthScore.grade}
          </span>
        </div>
        <div>
          <div className="text-xs font-bold" style={{ color }}>
            Health: {animatedScore}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            /100
          </div>
        </div>
      </div>
      {alertCount > 0 && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{ background: `color-mix(in srgb, var(--status-warning) 15%, transparent)` }}
        >
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--status-warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: 'var(--status-warning)' }}>
            {alertCount} Alert{alertCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
