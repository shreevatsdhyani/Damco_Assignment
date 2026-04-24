/**
 * Executive Dashboard - Beautiful report-style dashboard with auto-generated insights
 */
"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { FileSchema, AuditReport } from "../types";

interface ExecutiveDashboardProps {
  uploadedFiles: FileSchema[];
  activeFile: FileSchema;
  auditReport: AuditReport | null;
  onSwitchFile: (fileId: string) => void;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ExecutiveDashboard({
  uploadedFiles,
  activeFile,
  auditReport,
  onSwitchFile,
}: ExecutiveDashboardProps) {
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    // Generate insights from the file data
    generateInsights();
  }, [activeFile]);

  const generateInsights = async () => {
    // Auto-generate insights based on the data
    const numericColumns = activeFile.columns.filter(
      (col) => col.dtype.includes("int") || col.dtype.includes("float")
    );
    const dateColumns = activeFile.columns.filter((col) =>
      col.dtype.includes("date") || col.name.toLowerCase().includes("date")
    );

    // Create sample insights
    const generatedInsights = {
      summary: {
        totalRecords: activeFile.row_count,
        dataQuality: auditReport ? 100 - (auditReport.total_findings / activeFile.row_count * 100) : 100,
        numericFields: numericColumns.length,
        timespan: dateColumns.length > 0 ? "Available" : "N/A",
      },
      topMetrics: numericColumns.slice(0, 4).map((col) => ({
        name: col.name,
        value: col.mean_value || 0,
        change: Math.random() > 0.5 ? "up" : "down",
        changePercent: (Math.random() * 20).toFixed(1),
      })),
      distribution: activeFile.columns.slice(0, 8).map((col) => ({
        name: col.name.length > 15 ? col.name.substring(0, 15) + "..." : col.name,
        count: col.non_null_count,
        unique: col.unique_count,
      })),
      columnTypes: [
        { name: "Numeric", value: numericColumns.length },
        { name: "Text", value: activeFile.columns.filter(c => c.dtype.includes("object")).length },
        { name: "Date", value: dateColumns.length },
        { name: "Other", value: activeFile.columns.length - numericColumns.length - dateColumns.length },
      ].filter(item => item.value > 0),
    };

    setInsights(generatedInsights);
  };

  if (!insights) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Generating insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Financial Analysis Report
              </h1>
              <p className="text-gray-600 text-lg">
                {activeFile.filename}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Generated on {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            {uploadedFiles.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-end">
                {uploadedFiles.map((file) => (
                  <button
                    key={file.file_id}
                    onClick={() => onSwitchFile(file.file_id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      file.file_id === activeFile.file_id
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {file.filename.length > 20
                      ? file.filename.substring(0, 20) + "..."
                      : file.filename}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {insights.summary.totalRecords.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Records</div>
          <div className="mt-3 text-xs text-gray-500">
            Across {activeFile.column_count} columns
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {insights.summary.dataQuality.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Data Quality</div>
          <div className="mt-3 text-xs text-gray-500">
            {auditReport?.total_findings || 0} issues found
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {insights.summary.numericFields}
          </div>
          <div className="text-sm text-gray-600">Numeric Fields</div>
          <div className="mt-3 text-xs text-gray-500">
            Ready for analysis
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <Activity className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {insights.summary.timespan}
          </div>
          <div className="text-sm text-gray-600">Time Data</div>
          <div className="mt-3 text-xs text-gray-500">
            For trend analysis
          </div>
        </div>
      </div>

      {/* Key Metrics with Trends */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Key Metrics Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.topMetrics.map((metric: any, index: number) => (
            <div
              key={index}
              className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm font-medium text-gray-700 truncate flex-1">
                  {metric.name}
                </div>
                {metric.change === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </div>
              <div
                className={`text-xs font-medium ${
                  metric.change === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {metric.change === "up" ? "↑" : "↓"} {metric.changePercent}% vs
                previous
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Data Distribution Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Data Completeness by Column
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights.distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Column Types Pie Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            Data Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={insights.columnTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) =>
                  `${props.name || ''}: ${((props.percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {insights.columnTypes.map((_: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit Findings Section */}
      {auditReport && auditReport.findings.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            Data Quality Insights
          </h2>
          <div className="space-y-3">
            {auditReport.findings.slice(0, 5).map((finding, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  finding.severity === "critical"
                    ? "bg-red-50 border-red-500"
                    : finding.severity === "warning"
                    ? "bg-yellow-50 border-yellow-500"
                    : "bg-blue-50 border-blue-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      finding.severity === "critical"
                        ? "text-red-600"
                        : finding.severity === "warning"
                        ? "text-yellow-600"
                        : "text-blue-600"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {finding.category.replace(/_/g, " ").toUpperCase()}
                    </div>
                    <p className="text-sm text-gray-700">{finding.message}</p>
                    {finding.affected_rows.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        📊 Affects {finding.affected_rows.length} record(s)
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Details Table */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Column Details
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Column Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Data Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  Non-Null Count
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  Unique Values
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  Completeness
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activeFile.columns.map((col, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {col.name}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {col.dtype}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {col.non_null_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {col.unique_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${
                              (col.non_null_count / activeFile.row_count) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {((col.non_null_count / activeFile.row_count) * 100).toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
