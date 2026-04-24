/**
 * Aegis Command Center - AI CFO Dashboard
 * Three-zone layout: Briefing | Visualization | Risk Monitor
 * Voice-first command bar at the bottom
 */
"use client";

import { useState, useEffect } from "react";
import { MessageSquare, LayoutDashboard } from "lucide-react";
import UploadGate from "../components/UploadGate";
import DarkDashboard from "../components/DarkDashboard";
import BriefingPanel from "../components/BriefingPanel";
import RiskPanel from "../components/RiskPanel";
import ConversationHistory from "../components/ConversationHistory";
import VoiceCommandBar from "../components/VoiceCommandBar";
import HealthScoreBadge from "../components/HealthScoreBadge";
import ScenarioModal from "../components/ScenarioModal";
import { useFileUpload } from "../hooks/useFileUpload";
import { apiClient } from "../lib/api";
import type { BriefingResponse, HealthScoreResponse, ScenarioResponse, DashboardResponse, SuggestionsResponse } from "../types";

interface Message {
  role: "user" | "assistant";
  content: string;
  chartData?: any;
  chartType?: "bar" | "line" | "pie";
  audioUrl?: string;
  artifactHtml?: string;
}

export default function CommandCenter() {
  const [showGate, setShowGate] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardHistory, setDashboardHistory] = useState<any[]>([]);
  const [currentDashboardIndex, setCurrentDashboardIndex] = useState(0);
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());
  const [csvDataCache, setCsvDataCache] = useState<Map<string, any[]>>(new Map());

  const [centerView, setCenterView] = useState<"dashboard" | "chat">("chat");

  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScoreResponse | null>(null);
  const [aiDashboard, setAiDashboard] = useState<DashboardResponse | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiScenarios, setAiScenarios] = useState<string[]>([]);

  const {
    uploading,
    error,
    uploadedFile,
    uploadedFiles,
    auditReport,
    auditReports,
    uploadFile,
    uploadMultipleFiles,
    clearFile,
    switchFile,
  } = useFileUpload();

  useEffect(() => {
    if (uploadedFiles.length > 0 && !briefing) {
      fetchBriefing();
      fetchHealthScore();
      fetchAiDashboard();
    }
  }, [uploadedFiles]);

  useEffect(() => {
    if (uploadedFile) {
      fetchSuggestions();
    }
  }, [uploadedFile]);

  const fetchBriefing = async () => {
    setBriefingLoading(true);
    try {
      const fileIds = uploadedFiles.map(f => f.file_id);
      const result = await apiClient.generateBriefing(fileIds);
      setBriefing(result);
    } catch (err) {
      console.error("Briefing generation failed:", err);
    } finally {
      setBriefingLoading(false);
    }
  };

  const fetchHealthScore = async () => {
    setHealthLoading(true);
    try {
      const result = await apiClient.getHealthScore();
      setHealthScore(result);
    } catch (err) {
      console.error("Health score calculation failed:", err);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchAiDashboard = async () => {
    setDashboardLoading(true);
    try {
      const fileIds = uploadedFiles.map(f => f.file_id);
      const result = await apiClient.generateDashboard(fileIds);
      setAiDashboard(result);
    } catch (err) {
      console.error("AI Dashboard generation failed:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchSuggestions = async (lastQuestion?: string, lastAnswer?: string) => {
    if (!uploadedFile) return;
    try {
      const result = await apiClient.getSuggestions([uploadedFile.file_id], lastQuestion, lastAnswer);
      setAiSuggestions(result.questions || []);
      setAiScenarios(result.scenarios || []);
    } catch (err) {
      console.error("Suggestions generation failed:", err);
    }
  };

  const handleFileSelect = async (file: File) => {
    setPendingFiles((prev) => [...prev, file]);
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (pendingFiles.length === 0) return;

    try {
      const parsedCache = new Map<string, any[]>();
      for (const file of pendingFiles) {
        const text = await file.text();
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
          const row: any = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || "";
          });
          rows.push(row);
        }
        parsedCache.set(file.name.toLowerCase(), rows);
      }
      setCsvDataCache(parsedCache);

      if (pendingFiles.length === 1) {
        await uploadFile(pendingFiles[0]);
      } else {
        await uploadMultipleFiles(pendingFiles);
      }
      setPendingFiles([]);
      setShowGate(false);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setShowGate(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!uploadedFile) return;

    setCenterView("chat");
    setUsedQuestions((prev) => new Set([...prev, message.toLowerCase().trim()]));

    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/query/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_id: uploadedFile.file_id,
            question: message,
            voice_enabled: true,
          }),
        }
      );

      if (!response.ok) throw new Error("Query failed");

      const data = await response.json();

      const isIncomplete =
        !data.artifact_html &&
        !data.chart_data &&
        data.answer &&
        (data.answer.length < 100 || (data.answer.includes("Here are") && data.answer.length < 200));

      let finalAnswer = data.answer;
      let finalArtifactHtml = data.artifact_html;

      if (isIncomplete && csvDataCache.size > 0) {
        const { answerQuestion } = await import("../utils/clientQueryEngine");
        const clientResult = answerQuestion(message, csvDataCache);
        if (clientResult.success) {
          finalAnswer = clientResult.answer;
          finalArtifactHtml = clientResult.artifactHtml || finalArtifactHtml;
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content:
          (isIncomplete && csvDataCache.size > 0 && finalArtifactHtml !== data.artifact_html
            ? "[Answered by client-side engine]\n\n"
            : "") + (finalAnswer || "No response"),
        chartData: data.chart_data?.data,
        chartType: data.chart_data?.type,
        audioUrl: data.audio_url,
        artifactHtml: finalArtifactHtml,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      fetchSuggestions(message, finalAnswer || "");

      let artifactHtml = finalArtifactHtml;

      if (!artifactHtml && !data.chart_data && finalAnswer) {
        const { generateFallbackDashboard } = await import("../utils/fallbackDashboard");
        artifactHtml = generateFallbackDashboard(message, finalAnswer);
      }

      if (artifactHtml || data.chart_data) {
        const newDashboard = {
          question: message,
          artifactHtml: artifactHtml,
          chartData: data.chart_data?.data,
          chartType: data.chart_data?.type,
          timestamp: new Date().toISOString(),
        };
        setDashboardHistory((prev) => [...prev, newDashboard]);
        setCurrentDashboardIndex((prev) => prev + 1);
      }
    } catch (err: any) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${err.message || "Query execution failed"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchFile = (fileId: string) => {
    switchFile(fileId);
    setMessages([]);
    setDashboardHistory([]);
    setCurrentDashboardIndex(0);
    setUsedQuestions(new Set());
    setAiSuggestions([]);
    setAiScenarios([]);
  };

  const handleScenarioResult = (result: ScenarioResponse) => {
    const assistantMessage: Message = {
      role: "assistant",
      content: result.impact_summary,
      artifactHtml: result.artifact_html || undefined,
    };
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `What-if: ${result.scenario}` },
      assistantMessage,
    ]);

    if (result.artifact_html) {
      const newDashboard = {
        question: `Scenario: ${result.scenario}`,
        artifactHtml: result.artifact_html,
        timestamp: new Date().toISOString(),
      };
      setDashboardHistory((prev) => [...prev, newDashboard]);
      setCurrentDashboardIndex((prev) => prev + 1);
    }
  };

  const handlePreviousDashboard = () => {
    if (currentDashboardIndex > 0) setCurrentDashboardIndex((prev) => prev - 1);
  };

  const handleNextDashboard = () => {
    if (currentDashboardIndex < dashboardHistory.length) setCurrentDashboardIndex((prev) => prev + 1);
  };

  if (showGate || !uploadedFile) {
    return (
      <UploadGate
        onFileSelect={handleFileSelect}
        uploading={uploading}
        error={error}
        pendingFiles={pendingFiles}
        onRemovePendingFile={handleRemovePendingFile}
        onUploadAll={handleUploadAll}
        filesUploaded={!!uploadedFile}
      />
    );
  }

  const isAnyLoading = briefingLoading || healthLoading || dashboardLoading;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header
        className="border-b px-5 py-2.5 flex items-center justify-between z-10"
        style={{ background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
            <span className="font-bold text-sm" style={{ color: 'var(--text-on-accent)' }}>A</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Aegis</h1>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--text-secondary)' }}>AI CFO Command Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <HealthScoreBadge healthScore={healthScore} loading={healthLoading} />
          <button
            onClick={() => {
              clearFile();
              setBriefing(null);
              setHealthScore(null);
              setAiDashboard(null);
              setAiSuggestions([]);
              setAiScenarios([]);
              setShowGate(true);
              setMessages([]);
              setDashboardHistory([]);
              setCurrentDashboardIndex(0);
            }}
            className="px-3 py-1.5 text-xs rounded-lg transition-colors border"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            New Analysis
          </button>
        </div>
      </header>

      {/* Three-Zone Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Briefing Panel */}
        <div className="w-[22%] min-w-[240px] border-r overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
          <BriefingPanel
            briefing={briefing}
            healthScore={healthScore}
            dashboard={aiDashboard}
            loading={isAnyLoading && !briefing && !aiDashboard}
          />
        </div>

        {/* Center: Toggle between Chat and Dashboard */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toggle Header */}
          <div
            className="border-b px-5 py-2 flex items-center justify-between"
            style={{ background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--bg-card)' }}>
              <button
                onClick={() => setCenterView("chat")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: centerView === "chat" ? 'var(--accent-primary)' : 'transparent',
                  color: centerView === "chat" ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
                {messages.length > 0 && centerView !== "chat" && (
                  <span
                    className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: 'var(--accent-primary)', color: 'var(--text-on-accent)' }}
                  >
                    {messages.filter(m => m.role === "assistant").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCenterView("dashboard")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: centerView === "dashboard" ? 'var(--accent-primary)' : 'transparent',
                  color: centerView === "dashboard" ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                }}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
                {dashboardLoading && (
                  <span className="ml-1 w-4 h-4 rounded-full flex items-center justify-center">
                    <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
                  </span>
                )}
                {!dashboardLoading && dashboardHistory.length > 0 && centerView !== "dashboard" && (
                  <span
                    className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: 'var(--accent-primary)', color: 'var(--text-on-accent)' }}
                  >
                    {dashboardHistory.length}
                  </span>
                )}
              </button>
            </div>

            {centerView === "dashboard" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePreviousDashboard}
                  disabled={currentDashboardIndex === 0}
                  className="p-1.5 rounded-lg disabled:opacity-30 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {currentDashboardIndex === 0 ? "Overview" : `${currentDashboardIndex}/${dashboardHistory.length}`}
                </span>
                <button
                  onClick={handleNextDashboard}
                  disabled={currentDashboardIndex >= dashboardHistory.length}
                  className="p-1.5 rounded-lg disabled:opacity-30 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {currentDashboardIndex > 0 && dashboardHistory[currentDashboardIndex - 1] && (
                  <div className="text-[10px] italic max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>
                    &ldquo;{dashboardHistory[currentDashboardIndex - 1].question}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {centerView === "chat" ? (
              <ConversationHistory messages={messages} loading={loading} />
            ) : (
              <div className="h-full" key={`dashboard-${currentDashboardIndex}`}>
                {dashboardLoading && !aiDashboard && currentDashboardIndex === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-app)' }}>
                    <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      AI is analyzing your data and generating dashboard...
                    </p>
                  </div>
                ) : (
                  <DarkDashboard
                    key={`dashboard-content-${currentDashboardIndex}`}
                    uploadedFiles={uploadedFiles}
                    auditReports={auditReports}
                    onSwitchFile={handleSwitchFile}
                    customDashboard={currentDashboardIndex > 0 ? dashboardHistory[currentDashboardIndex - 1] : null}
                    aiDashboard={currentDashboardIndex === 0 ? aiDashboard : null}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Risk Panel */}
        <div className="w-[20%] min-w-[220px] border-l overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
          <RiskPanel
            risks={briefing?.risks || []}
            alerts={healthScore?.alerts || []}
            loading={briefingLoading || healthLoading}
          />
        </div>
      </div>

      {/* Bottom: Voice Command Bar */}
      <VoiceCommandBar
        onSendMessage={handleSendMessage}
        onOpenScenario={() => setScenarioOpen(true)}
        loading={loading}
        messages={messages}
        uploadedFiles={uploadedFiles}
        usedQuestions={usedQuestions}
        aiSuggestions={aiSuggestions}
      />

      {/* Scenario Modal */}
      {uploadedFile && (
        <ScenarioModal
          isOpen={scenarioOpen}
          onClose={() => setScenarioOpen(false)}
          fileId={uploadedFile.file_id}
          onResult={handleScenarioResult}
          dynamicPresets={aiScenarios}
        />
      )}
    </div>
  );
}
