/**
 * Aegis - Voice-Activated AI CFO
 * Main application with redesigned two-pane layout
 */
"use client";

import { useState } from "react";
import UploadGate from "../components/UploadGate";
import DarkDashboard from "../components/DarkDashboard";
import EnhancedChat from "../components/EnhancedChat";
import ThemeToggle from "../components/ThemeToggle";
import { useFileUpload } from "../hooks/useFileUpload";

interface Message {
  role: "user" | "assistant";
  content: string;
  chartData?: any;
  chartType?: "bar" | "line" | "pie";
  audioUrl?: string;
  artifactHtml?: string;
}

export default function Home() {
  const [showGate, setShowGate] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardHistory, setDashboardHistory] = useState<any[]>([]);
  const [currentDashboardIndex, setCurrentDashboardIndex] = useState(0);
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [csvDataCache, setCsvDataCache] = useState<Map<string, any[]>>(new Map());

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

  const handleFileSelect = async (file: File) => {
    setPendingFiles((prev) => [...prev, file]);
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (pendingFiles.length === 0) return;

    try {
      console.log("Analyzing CSV files locally...");
      const { analyzeCSVFiles } = await import("../utils/csvAnalytics");
      const analytics = await analyzeCSVFiles(pendingFiles);
      setAnalyticsData(analytics);
      console.log("Analytics complete:", analytics);

      const parsedCache = new Map<string, any[]>();
      for (const file of pendingFiles) {
        const text = await file.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });
          rows.push(row);
        }
        parsedCache.set(file.name.toLowerCase(), rows);
      }
      setCsvDataCache(parsedCache);
      console.log("CSV data cached for client-side queries");

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

      if (!response.ok) {
        throw new Error("Query failed");
      }

      const data = await response.json();

      console.log("Backend response:", {
        hasArtifact: !!data.artifact_html,
        hasChart: !!data.chart_data,
        answerLength: data.answer?.length,
        answerPreview: data.answer?.substring(0, 100)
      });

      const isIncomplete =
        !data.artifact_html &&
        !data.chart_data &&
        data.answer &&
        (data.answer.length < 100 || (data.answer.includes('Here are') && data.answer.length < 200));

      let finalAnswer = data.answer;
      let finalArtifactHtml = data.artifact_html;

      if (isIncomplete && csvDataCache.size > 0) {
        console.log("Backend response incomplete, trying client-side query...");

        const { answerQuestion } = await import("../utils/clientQueryEngine");
        const clientResult = answerQuestion(message, csvDataCache);

        if (clientResult.success) {
          finalAnswer = clientResult.answer;
          finalArtifactHtml = clientResult.artifactHtml || finalArtifactHtml;
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: (isIncomplete && csvDataCache.size > 0 && finalArtifactHtml !== data.artifact_html
          ? "[Answered by client-side engine]\n\n"
          : ""
        ) + (finalAnswer || "No response"),
        chartData: data.chart_data?.data,
        chartType: data.chart_data?.type,
        audioUrl: data.audio_url,
        artifactHtml: finalArtifactHtml,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      let artifactHtml = finalArtifactHtml;

      if (!artifactHtml && !data.chart_data && finalAnswer) {
        console.log("No artifact from backend, generating fallback dashboard...");
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
  };

  const handlePreviousDashboard = () => {
    if (currentDashboardIndex > 0) {
      setCurrentDashboardIndex((prev) => prev - 1);
    }
  };

  const handleNextDashboard = () => {
    if (currentDashboardIndex < dashboardHistory.length) {
      setCurrentDashboardIndex((prev) => prev + 1);
    }
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="border-b px-6 py-3 flex items-center justify-between z-10" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
            <span className="font-bold text-sm" style={{ color: 'var(--text-on-accent)' }}>A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Aegis</h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Voice-Activated AI CFO</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => {
              clearFile();
              setShowGate(true);
              setMessages([]);
            }}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Upload New File
          </button>
        </div>
      </header>

      {/* Two-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Enhanced Chat (30%) */}
        <div className="w-[30%] overflow-hidden">
          <EnhancedChat
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
            uploadedFiles={uploadedFiles}
            usedQuestions={usedQuestions}
          />
        </div>

        {/* Right Pane: Dark Dashboard (70%) */}
        <div className="w-[70%] overflow-hidden flex flex-col">
          {/* Dashboard Navigation Header */}
          <div className="border-b px-6 py-3 flex items-center justify-between" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-4">
              <button
                onClick={handlePreviousDashboard}
                disabled={currentDashboardIndex === 0}
                className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                title="Previous dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Dashboard {currentDashboardIndex} of {dashboardHistory.length}
                {currentDashboardIndex === 0 && " (Initial)"}
              </div>

              <button
                onClick={handleNextDashboard}
                disabled={currentDashboardIndex >= dashboardHistory.length}
                className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                title="Next dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {currentDashboardIndex > 0 && dashboardHistory[currentDashboardIndex - 1] && (
              <div className="text-xs italic max-w-md truncate" style={{ color: 'var(--text-secondary)' }}>
                &ldquo;{dashboardHistory[currentDashboardIndex - 1].question}&rdquo;
              </div>
            )}
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 overflow-hidden" key={`dashboard-${currentDashboardIndex}`}>
            <DarkDashboard
              key={`dashboard-content-${currentDashboardIndex}`}
              uploadedFiles={uploadedFiles}
              auditReports={auditReports}
              onSwitchFile={handleSwitchFile}
              customDashboard={currentDashboardIndex > 0 ? dashboardHistory[currentDashboardIndex - 1] : null}
              analyticsData={analyticsData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
