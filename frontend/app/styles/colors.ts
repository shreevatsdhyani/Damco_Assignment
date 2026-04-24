/**
 * Aegis Color System - GitHub Copilot Slate+Blue Theme
 * Colors are defined as CSS variables in globals.css
 * These constants are for chart rendering where CSS vars aren't available
 */

export const AegisColors = {
  dark: {
    background: { app: '#0d1117', card: '#161b22', input: '#21262d', hover: '#30363d' },
    border: { subtle: '#30363d' },
    accent: { primary: '#3b82f6', primaryHover: '#60a5fa', secondary: '#38bdf8' },
    text: { primary: '#e6edf3', secondary: '#8b949e', disabled: '#484f58', onAccent: '#ffffff' },
    status: { healthy: '#34d399', warning: '#fbbf24', critical: '#f87171' },
  },
  light: {
    background: { app: '#f8fafc', card: '#ffffff', input: '#f1f5f9', hover: '#e2e8f0' },
    border: { subtle: '#e2e8f0' },
    accent: { primary: '#2563eb', primaryHover: '#1d4ed8', secondary: '#0284c7' },
    text: { primary: '#0f172a', secondary: '#64748b', disabled: '#94a3b8', onAccent: '#ffffff' },
    status: { healthy: '#059669', warning: '#d97706', critical: '#dc2626' },
  },
  chart: [
    '#3b82f6',
    '#38bdf8',
    '#f87171',
    '#fbbf24',
    '#34d399',
    '#a855f7',
  ],
};
