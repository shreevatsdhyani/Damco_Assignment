/**
 * Aegis Color System - Dark & Light Theme Support
 * Colors are defined as CSS variables in globals.css
 * These constants are for chart rendering where CSS vars aren't available
 */

export const AegisColors = {
  dark: {
    background: { app: '#0a0d12', card: '#141b26', input: '#1e293b', hover: '#1e293b' },
    border: { subtle: '#2d3748' },
    accent: { primary: '#bfff00', primaryHover: '#f5ff8a', secondary: '#00d9ff' },
    text: { primary: '#e8ecf1', secondary: '#8b92a1', disabled: '#4a5568', onAccent: '#0a0d12' },
    status: { healthy: '#10e37d', warning: '#ff9500', critical: '#ff5757' },
  },
  light: {
    background: { app: '#f4f6f9', card: '#ffffff', input: '#e8ecf1', hover: '#dde3eb' },
    border: { subtle: '#c9d1dc' },
    accent: { primary: '#4d7a00', primaryHover: '#3d6100', secondary: '#0078a8' },
    text: { primary: '#0f1419', secondary: '#4a5568', disabled: '#a0aec0', onAccent: '#ffffff' },
    status: { healthy: '#059669', warning: '#d97706', critical: '#dc2626' },
  },
  chart: [
    '#bfff00',
    '#00d9ff',
    '#ff5757',
    '#ff9500',
    '#10e37d',
    '#a855f7',
  ],
};
