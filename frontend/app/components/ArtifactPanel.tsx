/**
 * ArtifactPanel - Sandboxed iframe for rendering dashboard HTML
 * Theme-aware: replaces dark palette colors with current theme colors
 */
"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "../lib/ThemeContext";
import { AegisColors } from "../styles/colors";

interface ArtifactPanelProps {
  html: string;
  title?: string;
}

const DARK_TO_KEY_MAP: [string, (c: typeof AegisColors.dark) => string][] = [
  // LLM-generated HTML uses these dark palette hex codes from the system prompt
  ["#0a0b0f", (c) => c.background.app],
  ["#0a0d12", (c) => c.background.app],
  ["#0d1117", (c) => c.background.app],
  ["#111318", (c) => c.background.card],
  ["#141b26", (c) => c.background.card],
  ["#161b22", (c) => c.background.card],
  ["#1e293b", (c) => c.background.input],
  ["#21262d", (c) => c.background.input],
  ["#1f2937", (c) => c.border.subtle],
  ["#2d3748", (c) => c.border.subtle],
  ["#30363d", (c) => c.border.subtle],
  // Old neon greens → new blue accent
  ["#e8ff47", (c) => c.accent.primary],
  ["#bfff00", (c) => c.accent.primary],
  ["#f5ff8a", (c) => c.accent.primaryHover],
  // New blue accent (identity for dark, mapped for light)
  ["#3b82f6", (c) => c.accent.primary],
  ["#60a5fa", (c) => c.accent.primaryHover],
  ["#38bdf8", (c) => c.accent.secondary],
  // Text
  ["#f0f2f8", (c) => c.text.primary],
  ["#e8ecf1", (c) => c.text.primary],
  ["#e6edf3", (c) => c.text.primary],
  ["#7a8099", (c) => c.text.secondary],
  ["#8b92a1", (c) => c.text.secondary],
  ["#8b949e", (c) => c.text.secondary],
  ["#4a5568", (c) => c.text.disabled],
  ["#484f58", (c) => c.text.disabled],
  // Status
  ["#10e37d", (c) => c.status.healthy],
  ["#34d399", (c) => c.status.healthy],
  ["#ff9500", (c) => c.status.warning],
  ["#fbbf24", (c) => c.status.warning],
  ["#ff5757", (c) => c.status.critical],
  ["#f87171", (c) => c.status.critical],
];

function applyThemeToHtml(html: string, theme: "dark" | "light"): string {
  if (theme === "dark") return html;

  const lightColors = AegisColors.light;
  let result = html;

  for (const [darkHex, getter] of DARK_TO_KEY_MAP) {
    const lightHex = getter(lightColors);
    if (darkHex.toLowerCase() !== lightHex.toLowerCase()) {
      result = result.replaceAll(darkHex, lightHex);
    }
  }

  // Handle rgba patterns used in dark theme
  result = result.replaceAll("rgba(0,0,0,.15)", "rgba(0,0,0,.06)");
  result = result.replaceAll("rgba(0,0,0,.25)", "rgba(0,0,0,.1)");
  result = result.replaceAll("rgba(0,0,0,.4)", "rgba(0,0,0,.08)");
  result = result.replaceAll("rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.08)");
  result = result.replaceAll("rgba(255, 68, 68, 0.1)", "rgba(220, 38, 38, 0.08)");
  result = result.replaceAll("rgba(255, 170, 0, 0.1)", "rgba(217, 119, 6, 0.08)");

  return result;
}

export default function ArtifactPanel({ html, title }: ArtifactPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        const themedHtml = applyThemeToHtml(html, theme);
        doc.open();
        doc.write(themedHtml);
        doc.close();
      }
    }
  }, [html, theme]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}>
      {title && (
        <div className="px-4 py-2 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <h3 className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>{title}</h3>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="Dashboard Artifact"
      />
    </div>
  );
}
