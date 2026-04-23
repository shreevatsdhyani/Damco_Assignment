/**
 * Insights Dashboard - Left pane showing metrics, schema, and audit
 */
"use client";

import { Database, AlertTriangle, CheckCircle, Info, FileText } from "lucide-react";
import type { FileSchema, AuditReport } from "../types";

interface InsightsDashboardProps {
  uploadedFiles: FileSchema[];
  activeFile: FileSchema;
  auditReport: AuditReport | null;
  onSwitchFile: (fileId: string) => void;
}

export default function InsightsDashboard({
  uploadedFiles,
  activeFile,
  auditReport,
  onSwitchFile,
}: InsightsDashboardProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Financial Insights
        </h1>
        <p className="text-gray-600">
          AI-powered analysis of your financial data
        </p>
      </div>

      {/* File Tabs */}
      {uploadedFiles.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {uploadedFiles.map((file) => (
            <button
              key={file.file_id}
              onClick={() => onSwitchFile(file.file_id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                file.file_id === activeFile.file_id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              {file.filename}
            </button>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Rows</span>
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {activeFile.row_count.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Columns</span>
            <Database className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {activeFile.column_count}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Audit Findings
            </span>
            {auditReport && auditReport.total_findings > 0 ? (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {auditReport?.total_findings || 0}
          </div>
        </div>
      </div>

      {/* Schema Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-900">Schema Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeFile.columns.slice(0, 9).map((col, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="font-medium text-sm text-gray-900 mb-1 truncate">
                {col.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                  {col.dtype}
                </span>
                <span>{col.non_null_count.toLocaleString()} non-null</span>
              </div>
              {col.mean_value !== undefined && col.mean_value !== null && (
                <div className="text-xs text-gray-500">
                  Mean: {col.mean_value.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
        {activeFile.columns.length > 9 && (
          <p className="text-xs text-gray-500 mt-3">
            + {activeFile.columns.length - 9} more columns
          </p>
        )}
      </div>

      {/* Audit Report */}
      {auditReport && auditReport.findings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900">Audit Findings</h2>
          </div>
          <div className="space-y-3">
            {auditReport.findings.slice(0, 5).map((finding, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(
                  finding.severity
                )}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(finding.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {finding.category.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          finding.severity === "critical"
                            ? "bg-red-100 text-red-700"
                            : finding.severity === "warning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{finding.message}</p>
                    {finding.affected_rows.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Affects {finding.affected_rows.length} row(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {auditReport.findings.length > 5 && (
            <p className="text-xs text-gray-500 mt-3">
              + {auditReport.findings.length - 5} more findings
            </p>
          )}
        </div>
      )}
    </div>
  );
}
