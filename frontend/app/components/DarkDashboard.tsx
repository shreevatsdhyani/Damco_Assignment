/**
 * DarkDashboard - Dashboard view orchestrator
 * Shows DynamicDashboard (AI-generated) when available, falls back to file overview
 */
"use client";

import { useEffect, useState } from "react";
import ArtifactPanel from "./ArtifactPanel";
import DynamicDashboard from "./DynamicDashboard";
import { useTheme } from "../lib/ThemeContext";
import { AegisColors } from "../styles/colors";
import type { DashboardResponse } from "../types";

interface FileSchema {
  file_id: string;
  filename: string;
  row_count: number;
  columns: {
    name: string;
    dtype: string;
    non_null_count: number;
    sample_values: any[];
  }[];
}

interface AuditReport {
  file_id: string;
  filename?: string;
  findings: any[];
}

interface CustomDashboard {
  question: string;
  artifactHtml?: string;
  chartData?: any;
  chartType?: "bar" | "line" | "pie";
  timestamp: string;
}

interface DarkDashboardProps {
  uploadedFiles: FileSchema[];
  auditReports: Map<string, AuditReport>;
  onSwitchFile: (fileId: string) => void;
  customDashboard?: CustomDashboard | null;
  analyticsData?: any;
  aiDashboard?: DashboardResponse | null;
}

export default function DarkDashboard({
  uploadedFiles,
  auditReports,
  onSwitchFile,
  customDashboard,
  analyticsData,
  aiDashboard,
}: DarkDashboardProps) {
  const [dashboardHtml, setDashboardHtml] = useState<string>("");
  const { theme } = useTheme();
  const colors = AegisColors[theme];

  useEffect(() => {
    if (uploadedFiles.length > 0 && !aiDashboard) {
      setDashboardHtml(generateDashboardHtml(uploadedFiles, auditReports, colors));
    }
  }, [uploadedFiles, auditReports, theme, colors, aiDashboard]);

  if (uploadedFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
        <p>Upload files to see your dashboard</p>
      </div>
    );
  }

  if (customDashboard) {
    if (customDashboard.artifactHtml) {
      return (
        <div className="h-full w-full" key={customDashboard.timestamp}>
          <ArtifactPanel html={customDashboard.artifactHtml} key={customDashboard.timestamp} />
        </div>
      );
    }

    if (customDashboard.chartData && customDashboard.chartType) {
      const chartHtml = generateChartHtml(
        customDashboard.chartData,
        customDashboard.chartType,
        customDashboard.question,
        colors
      );
      return (
        <div className="h-full w-full" key={customDashboard.timestamp}>
          <ArtifactPanel html={chartHtml} key={customDashboard.timestamp} />
        </div>
      );
    }
  }

  if (aiDashboard) {
    return (
      <div className="h-full w-full" key="ai-dashboard">
        <DynamicDashboard dashboard={aiDashboard} />
      </div>
    );
  }

  return (
    <div className="h-full w-full" key="initial-dashboard">
      <ArtifactPanel html={dashboardHtml} key={`initial-dashboard-${theme}`} />
    </div>
  );
}

type ThemeColors = typeof AegisColors.dark;

function generateDashboardHtml(
  files: FileSchema[],
  audits: Map<string, AuditReport>,
  c: ThemeColors
): string {
  const totalRecords = files.reduce((sum, f) => sum + f.row_count, 0);
  const totalColumns = files.reduce((sum, f) => sum + f.columns.length, 0);
  const totalFindings = Array.from(audits.values()).reduce(
    (sum, a) => sum + a.findings.length,
    0
  );
  const avgQuality =
    totalRecords > 0
      ? Math.round(100 - (totalFindings / totalRecords) * 100 * 100) / 100
      : 100;

  const fileData = files.map((file) => {
    const audit = audits.get(file.file_id);
    const findings = audit?.findings.length || 0;
    const quality =
      file.row_count > 0
        ? Math.round(100 - (findings / file.row_count) * 100 * 100) / 100
        : 100;

    return {
      name: file.filename.replace(/\.[^/.]+$/, "").substring(0, 20),
      records: file.row_count,
      quality: quality,
    };
  });

  const fileDataJson = JSON.stringify(fileData);

  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <title>Dashboard Overview</title>
  <link href='https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap' rel='stylesheet'>
  <script src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0 }
    body {
      background: ${c.background.app};
      color: ${c.text.primary};
      font-family: 'DM Sans', sans-serif;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .header {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 32px;
      color: ${c.accent.primary};
      margin-bottom: 8px;
    }
    .subheader {
      font-size: 14px;
      color: ${c.text.secondary};
      margin-bottom: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .kpi {
      background: ${c.background.card};
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,.15);
    }
    .kpi-label {
      font-size: 12px;
      color: ${c.text.secondary};
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .kpi-value {
      font-family: 'DM Mono', monospace;
      font-size: 32px;
      color: ${c.accent.primary};
      margin-top: 8px;
    }
    .kpi-desc {
      font-size: 11px;
      color: ${c.text.secondary};
      margin-top: 8px;
    }
    .card {
      background: ${c.background.card};
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,.15);
    }
    .title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 24px;
      color: ${c.accent.primary};
      margin-bottom: 16px;
    }
    .chart-wrap {
      position: relative;
      height: 320px;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }
  </style>
</head>
<body>
  <div class='header'>Your Data Overview</div>
  <div class='subheader'>Comprehensive summary across all uploaded files</div>

  <div class='grid'>
    <div class='kpi'>
      <div class='kpi-label'>Total Records</div>
      <div class='kpi-value'>${totalRecords.toLocaleString()}</div>
      <div class='kpi-desc'>Total rows across ${files.length} file${files.length !== 1 ? "s" : ""}</div>
    </div>
    <div class='kpi'>
      <div class='kpi-label'>Data Quality</div>
      <div class='kpi-value'>${avgQuality}%</div>
      <div class='kpi-desc'>${avgQuality >= 95 ? "Excellent" : avgQuality >= 85 ? "Good" : "Needs attention"} - ${totalFindings} issue${totalFindings !== 1 ? "s" : ""} found</div>
    </div>
    <div class='kpi'>
      <div class='kpi-label'>Total Columns</div>
      <div class='kpi-value'>${totalColumns}</div>
      <div class='kpi-desc'>Different types of information tracked</div>
    </div>
    <div class='kpi'>
      <div class='kpi-label'>Files Uploaded</div>
      <div class='kpi-value'>${files.length}</div>
      <div class='kpi-desc'>Active datasets ready for analysis</div>
    </div>
  </div>

  <div class='charts-grid'>
    <div class='card'>
      <div class='title'>Records by File</div>
      <div class='chart-wrap'>
        <canvas id='recordsChart'></canvas>
      </div>
    </div>
    <div class='card'>
      <div class='title'>Quality Score by File</div>
      <div class='chart-wrap'>
        <canvas id='qualityChart'></canvas>
      </div>
    </div>
  </div>

  <script>
    const fileData = ${fileDataJson};

    new Chart(document.getElementById('recordsChart'), {
      type: 'bar',
      data: {
        labels: fileData.map(x => x.name),
        datasets: [{
          data: fileData.map(x => x.records),
          backgroundColor: '${c.accent.primary}',
          borderRadius: 6,
          hoverBackgroundColor: '${c.accent.primaryHover}'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '${c.background.card}',
            titleColor: '${c.accent.primary}',
            bodyColor: '${c.text.primary}',
            borderColor: '${c.border.subtle}',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ctx.parsed.y.toLocaleString() + ' records'
            }
          }
        },
        scales: {
          y: {
            grid: { color: '${c.border.subtle}' },
            ticks: {
              color: '${c.text.secondary}',
              callback: (v) => v.toLocaleString()
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '${c.text.secondary}' }
          }
        }
      }
    });

    new Chart(document.getElementById('qualityChart'), {
      type: 'bar',
      data: {
        labels: fileData.map(x => x.name),
        datasets: [{
          data: fileData.map(x => x.quality),
          backgroundColor: fileData.map(x =>
            x.quality >= 95 ? '${c.status.healthy}' : x.quality >= 85 ? '${c.status.warning}' : '${c.status.critical}'
          ),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '${c.background.card}',
            titleColor: '${c.accent.primary}',
            bodyColor: '${c.text.primary}',
            borderColor: '${c.border.subtle}',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ctx.parsed.y + '% quality'
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: '${c.border.subtle}' },
            ticks: {
              color: '${c.text.secondary}',
              callback: (v) => v + '%'
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '${c.text.secondary}' }
          }
        }
      }
    });
  </script>
</body>
</html>`;
}

function generateChartHtml(
  chartData: any[],
  chartType: "bar" | "line" | "pie",
  question: string,
  c: ThemeColors
): string {
  const chartDataJson = JSON.stringify(chartData);

  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <title>Chart</title>
  <link href='https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap' rel='stylesheet'>
  <script src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0 }
    body {
      background: ${c.background.app};
      color: ${c.text.primary};
      font-family: 'DM Sans', sans-serif;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100vh;
    }
    .header {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 28px;
      color: ${c.accent.primary};
      margin-bottom: 8px;
    }
    .card {
      background: ${c.background.card};
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,.15);
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .chart-wrap {
      position: relative;
      flex: 1;
    }
  </style>
</head>
<body>
  <div class='header'>${question}</div>
  <div class='card'>
    <div class='chart-wrap'>
      <canvas id='mainChart'></canvas>
    </div>
  </div>

  <script>
    const data = ${chartDataJson};

    new Chart(document.getElementById('mainChart'), {
      type: '${chartType}',
      data: {
        labels: data.map(x => x.name || x.label),
        datasets: [{
          data: data.map(x => x.value),
          backgroundColor: '${chartType === "pie" ? `['${c.accent.primary}', '${c.status.healthy}', '${c.status.warning}', '${c.status.critical}', '#8b5cf6', '#ec4899']` : c.accent.primary}',
          borderRadius: ${chartType === "bar" ? "6" : "0"},
          borderWidth: ${chartType === "pie" ? "2" : "0"},
          borderColor: '${c.background.app}'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: ${chartType === "pie" ? "true" : "false"}, labels: { color: '${c.text.primary}' } },
          tooltip: {
            backgroundColor: '${c.background.card}',
            titleColor: '${c.accent.primary}',
            bodyColor: '${c.text.primary}',
            borderColor: '${c.border.subtle}',
            borderWidth: 1
          }
        },
        scales: ${
          chartType !== "pie"
            ? `{
          y: {
            grid: { color: '${c.border.subtle}' },
            ticks: { color: '${c.text.secondary}' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '${c.text.secondary}' }
          }
        }`
            : "{}"
        }
      }
    });
  </script>
</body>
</html>`;
}
