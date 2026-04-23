/**
 * Audit findings panel component
 * Displays automated audit results
 */
"use client";

import { AlertTriangle, Info, XCircle, CheckCircle } from "lucide-react";
import type { AuditReport } from "../types";

interface AuditPanelProps {
  auditReport: AuditReport;
}

export default function AuditPanel({ auditReport }: AuditPanelProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Audit Report</h2>
          {auditReport.total_findings === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">All Clear</span>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {auditReport.total_findings} finding
              {auditReport.total_findings !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {auditReport.total_findings === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-sm">No issues detected in your financial data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {auditReport.findings.map((finding, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${getSeverityColor(
                  finding.severity
                )}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(finding.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium uppercase text-gray-600">
                        {finding.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white">
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      {finding.message}
                    </p>
                    {finding.affected_rows &&
                      finding.affected_rows.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Affected rows: {finding.affected_rows.slice(0, 5).join(", ")}
                          {finding.affected_rows.length > 5 && "..."}
                        </p>
                      )}
                    {finding.details && (
                      <div className="text-xs text-gray-600 mt-2">
                        {Object.entries(finding.details).map(([key, value]) => (
                          <div key={key}>
                            {key}: {JSON.stringify(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Audited at {new Date(auditReport.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
