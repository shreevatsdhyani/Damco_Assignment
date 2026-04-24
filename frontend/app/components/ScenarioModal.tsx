"use client";

import { useState } from "react";
import { X, FlaskConical, ArrowRight, Loader2 } from "lucide-react";
import { apiClient } from "../lib/api";
import type { ScenarioResponse } from "../types";

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  onResult: (result: ScenarioResponse) => void;
  dynamicPresets?: string[];
}

const FALLBACK_SCENARIOS = [
  "What if revenue drops 20%?",
  "What if we cut costs by 30%?",
  "What if we double the headcount?",
  "What if expenses increase by 50%?",
  "What if we lose our top 3 largest transactions?",
];

export default function ScenarioModal({ isOpen, onClose, fileId, onResult, dynamicPresets }: ScenarioModalProps) {
  const presets = dynamicPresets && dynamicPresets.length > 0 ? dynamicPresets : FALLBACK_SCENARIOS;
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRun = async (text: string) => {
    const scenarioText = text || scenario;
    if (!scenarioText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.runScenario(fileId, scenarioText.trim());
      onResult(result);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Scenario analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-lg rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, var(--accent-secondary) 20%, transparent)` }}>
              <FlaskConical className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>What-If Scenario</h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Model hypothetical changes to your data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Presets */}
          <div>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Quick scenarios
            </p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setScenario(preset);
                    handleRun(preset);
                  }}
                  disabled={loading}
                  className="px-3 py-2 text-xs rounded-lg border transition-colors disabled:opacity-50"
                  style={{
                    background: 'transparent',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Or describe your own
            </p>
            <textarea
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              placeholder="E.g., What if we increase marketing budget by 40% and reduce operational costs by 15%?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2"
              style={{
                background: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg text-xs" style={{ background: `color-mix(in srgb, var(--status-critical) 15%, transparent)`, color: 'var(--status-critical)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm rounded-xl"
            style={{ color: 'var(--text-secondary)' }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => handleRun("")}
            disabled={loading || !scenario.trim()}
            className="px-5 py-2.5 text-sm rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
            style={{ background: 'var(--accent-primary)', color: 'var(--text-on-accent)' }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Running...</>
            ) : (
              <><FlaskConical className="w-4 h-4" /> Run Scenario <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
