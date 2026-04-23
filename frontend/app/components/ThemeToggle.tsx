"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-[var(--accent-primary)]" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--accent-primary)]" />
      )}
    </button>
  );
}
