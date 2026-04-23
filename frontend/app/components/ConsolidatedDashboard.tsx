/**
 * Consolidated Dashboard - Summary view across ALL uploaded files
 * Designed for non-technical users with rich explanatory content
 */
"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  CheckCircle,
  Database,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  DollarSign,
  Users,
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { FileSchema, AuditReport } from "../types";

interface ConsolidatedDashboardProps {
  uploadedFiles: FileSchema[];
  auditReports: Map<string, AuditReport>;
  onSwitchFile: (fileId: string) => void;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ConsolidatedDashboard({
  uploadedFiles,
  auditReports,
  onSwitchFile,
}: ConsolidatedDashboardProps) {
  const [consolidatedData, setConsolidatedData] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["overview"]));

  useEffect(() => {
    generateConsolidatedInsights();
  }, [uploadedFiles, auditReports]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const generateConsolidatedInsights = () => {
    // Aggregate data from all files
    const totalRecords = uploadedFiles.reduce((sum, file) => sum + file.row_count, 0);
    const totalColumns = uploadedFiles.reduce((sum, file) => sum + file.column_count, 0);
    const totalFindings = Array.from(auditReports.values()).reduce(
      (sum, report) => sum + report.total_findings,
      0
    );

    // Calculate overall quality
    const avgQuality = uploadedFiles.length > 0
      ? 100 - (totalFindings / totalRecords) * 100
      : 100;

    // Analyze file types and structures
    const fileBreakdown = uploadedFiles.map((file) => {
      const numericCols = file.columns.filter(
        (col) => col.dtype.includes("int") || col.dtype.includes("float")
      ).length;
      const textCols = file.columns.filter((col) => col.dtype.includes("object")).length;
      const dateCols = file.columns.filter(
        (col) => col.dtype.includes("date") || col.name.toLowerCase().includes("date")
      ).length;

      return {
        name: file.filename.length > 25 ? file.filename.substring(0, 25) + "..." : file.filename,
        fullName: file.filename,
        fileId: file.file_id,
        records: file.row_count,
        columns: file.column_count,
        numeric: numericCols,
        text: textCols,
        date: dateCols,
        quality: auditReports.get(file.file_id)
          ? 100 - (auditReports.get(file.file_id)!.total_findings / file.row_count) * 100
          : 100,
      };
    });

    // Aggregate column types across all files
    const totalNumeric = fileBreakdown.reduce((sum, f) => sum + f.numeric, 0);
    const totalText = fileBreakdown.reduce((sum, f) => sum + f.text, 0);
    const totalDate = fileBreakdown.reduce((sum, f) => sum + f.date, 0);
    const totalOther = totalColumns - totalNumeric - totalText - totalDate;

    // Find best and worst quality files
    const sortedByQuality = [...fileBreakdown].sort((a, b) => b.quality - a.quality);
    const bestFile = sortedByQuality[0];
    const worstFile = sortedByQuality[sortedByQuality.length - 1];

    // Create insights
    const insights = {
      overview: {
        totalFiles: uploadedFiles.length,
        totalRecords,
        totalColumns,
        avgQuality: avgQuality.toFixed(1),
        totalFindings,
      },
      fileBreakdown,
      columnTypes: [
        { name: "Numbers", value: totalNumeric, description: "Columns with numeric data (for calculations)" },
        { name: "Text", value: totalText, description: "Columns with text/descriptions" },
        { name: "Dates", value: totalDate, description: "Columns with date/time information" },
        { name: "Other", value: totalOther, description: "Other data types" },
      ].filter((item) => item.value > 0),
      qualityComparison: fileBreakdown.map((f) => ({
        name: f.name,
        quality: Math.round(f.quality),
      })),
      sizeComparison: fileBreakdown.map((f) => ({
        name: f.name,
        records: f.records,
      })),
      bestFile,
      worstFile,
      recommendations: generateRecommendations(fileBreakdown, totalFindings, avgQuality),
    };

    setConsolidatedData(insights);
  };

  const generateRecommendations = (files: any[], findings: number, quality: number) => {
    const recommendations = [];

    if (quality < 90) {
      recommendations.push({
        type: "warning",
        title: "Data Quality Needs Attention",
        description: `Your overall data quality is ${quality.toFixed(1)}%. Consider reviewing the ${findings} data quality issues found across your files.`,
        action: "Review the Data Quality Insights section below for specific issues.",
      });
    } else {
      recommendations.push({
        type: "success",
        title: "Excellent Data Quality",
        description: `Your data quality is ${quality.toFixed(1)}%! Your files are clean and ready for analysis.`,
        action: "You can proceed with confidence in your analysis.",
      });
    }

    const largeFiles = files.filter((f) => f.records > 5000);
    if (largeFiles.length > 0) {
      recommendations.push({
        type: "info",
        title: "Large Datasets Detected",
        description: `You have ${largeFiles.length} file(s) with over 5,000 records. This is great for detailed analysis!`,
        action: "Use the chat to ask specific questions about trends and patterns.",
      });
    }

    const filesWithDates = files.filter((f) => f.date > 0);
    if (filesWithDates.length > 0) {
      recommendations.push({
        type: "success",
        title: "Time-Based Analysis Available",
        description: `${filesWithDates.length} of your files contain date columns. Perfect for tracking changes over time!`,
        action: "Try asking: 'Show me trends over the last 3 months'",
      });
    }

    return recommendations;
  };

  if (!consolidatedData) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-700">Analyzing your data...</p>
          <p className="text-sm text-gray-500 mt-2">
            We're creating insights from {uploadedFiles.length} file(s)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-3">📊 Your Financial Data Overview</h1>
            <p className="text-xl text-blue-100 mb-6">
              Here's everything you need to know about your uploaded files - explained in plain English
            </p>
            <div className="flex items-center gap-6 text-blue-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <span>Last Updated: Just now</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold">{consolidatedData.overview.totalFiles}</div>
            <div className="text-lg text-blue-100">File{consolidatedData.overview.totalFiles !== 1 ? "s" : ""} Uploaded</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Database className="w-7 h-7 text-blue-600" />
            </div>
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {consolidatedData.overview.totalRecords.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-gray-600 mb-2">Total Records</div>
          <div className="text-xs text-gray-500">
            💡 This is the total number of rows across all your files. Think of each row as one transaction or entry.
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <Activity className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {consolidatedData.overview.avgQuality}%
          </div>
          <div className="text-sm font-medium text-gray-600 mb-2">Data Quality Score</div>
          <div className="text-xs text-gray-500">
            💡 How clean your data is. Above 95% is excellent, 85-95% is good, below 85% needs attention.
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Layers className="w-7 h-7 text-purple-600" />
            </div>
            <BarChart3 className="w-6 h-6 text-purple-500" />
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {consolidatedData.overview.totalColumns}
          </div>
          <div className="text-sm font-medium text-gray-600 mb-2">Total Columns</div>
          <div className="text-xs text-gray-500">
            💡 Different types of information you're tracking (like date, amount, description, etc.)
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="w-7 h-7 text-orange-600" />
            </div>
            <Info className="w-6 h-6 text-orange-500" />
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {consolidatedData.overview.totalFindings}
          </div>
          <div className="text-sm font-medium text-gray-600 mb-2">Data Issues Found</div>
          <div className="text-xs text-gray-500">
            💡 Missing values, duplicates, or inconsistencies. Don't worry - we'll explain each one!
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {consolidatedData.recommendations.length > 0 && (
        <div className="mb-8">
          <div
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer"
            onClick={() => toggleSection("recommendations")}
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">💡 Smart Recommendations</h2>
                  <p className="text-sm text-gray-600">
                    Based on your data, here's what you should know
                  </p>
                </div>
              </div>
              {expandedSections.has("recommendations") ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </div>
            {expandedSections.has("recommendations") && (
              <div className="p-6 space-y-4">
                {consolidatedData.recommendations.map((rec: any, index: number) => (
                  <div
                    key={index}
                    className={`p-5 rounded-lg border-l-4 ${
                      rec.type === "warning"
                        ? "bg-yellow-50 border-yellow-500"
                        : rec.type === "success"
                        ? "bg-green-50 border-green-500"
                        : "bg-blue-50 border-blue-500"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {rec.type === "warning" && (
                        <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                      )}
                      {rec.type === "success" && (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      )}
                      {rec.type === "info" && (
                        <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{rec.title}</h3>
                        <p className="text-gray-700 mb-3">{rec.description}</p>
                        <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm font-medium text-gray-800">
                            <span className="text-blue-600">→</span> What to do: {rec.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Comparison Section */}
      <div className="mb-8">
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer"
          onClick={() => toggleSection("comparison")}
        >
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">📁 Your Files at a Glance</h2>
                <p className="text-sm text-gray-600">
                  Compare all {consolidatedData.overview.totalFiles} uploaded files
                </p>
              </div>
            </div>
            {expandedSections.has("comparison") ? (
              <ChevronUp className="w-6 h-6 text-gray-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            )}
          </div>
          {expandedSections.has("comparison") && (
            <div className="p-6">
              {/* File Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {consolidatedData.fileBreakdown.map((file: any) => (
                  <div
                    key={file.fileId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchFile(file.fileId);
                    }}
                    className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{file.fullName}</h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              file.quality >= 95
                                ? "bg-green-100 text-green-700"
                                : file.quality >= 85
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {file.quality.toFixed(1)}% Quality
                          </span>
                        </div>
                      </div>
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-900">
                          {file.records.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Records</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-900">{file.columns}</div>
                        <div className="text-xs text-gray-600">Columns</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>📊 {file.numeric} numeric columns (for calculations)</div>
                      <div>📝 {file.text} text columns (descriptions)</div>
                      {file.date > 0 && <div>📅 {file.date} date columns (time tracking)</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-5 shadow-md">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    File Size Comparison
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Number of records in each file - bigger bars mean more data to analyze
                  </p>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={consolidatedData.sizeComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => [value.toLocaleString() + " records", "Size"]}
                      />
                      <Bar dataKey="records" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-md">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Data Quality Comparison
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Quality score for each file - higher is better (100% is perfect!)
                  </p>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={consolidatedData.qualityComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => [value + "%", "Quality"]}
                      />
                      <Bar dataKey="quality" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Type Distribution */}
      <div className="mb-8">
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer"
          onClick={() => toggleSection("types")}
        >
          <div className="bg-gradient-to-r from-green-50 to-teal-50 px-6 py-4 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <PieChartIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">🔢 Types of Data You Have</h2>
                <p className="text-sm text-gray-600">
                  Understanding what kind of information is in your files
                </p>
              </div>
            </div>
            {expandedSections.has("types") ? (
              <ChevronUp className="w-6 h-6 text-gray-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            )}
          </div>
          {expandedSections.has("types") && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={consolidatedData.columnTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {consolidatedData.columnTypes.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 className="font-bold text-gray-900 mb-2">What does this mean?</h4>
                    <p className="text-sm text-gray-700">
                      Your data is divided into different types. Here's what each type is useful for:
                    </p>
                  </div>
                  {consolidatedData.columnTypes.map((type: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 mb-1">
                            {type.name}: {type.value} columns
                          </div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Best & Worst Performers */}
      {uploadedFiles.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">🏆 Best Quality File</h3>
                <p className="text-sm text-gray-600">Your cleanest data</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 mb-3">
              <div className="font-bold text-lg text-gray-900 mb-2">
                {consolidatedData.bestFile.fullName}
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {consolidatedData.bestFile.quality.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                This file has the fewest issues and is ready for analysis!
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="font-medium text-gray-600">Records</div>
                <div className="text-lg font-bold text-gray-900">
                  {consolidatedData.bestFile.records.toLocaleString()}
                </div>
              </div>
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="font-medium text-gray-600">Columns</div>
                <div className="text-lg font-bold text-gray-900">
                  {consolidatedData.bestFile.columns}
                </div>
              </div>
            </div>
          </div>

          {consolidatedData.worstFile.quality < 95 && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">⚠️ Needs Attention</h3>
                  <p className="text-sm text-gray-600">This file has some issues</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 mb-3">
                <div className="font-bold text-lg text-gray-900 mb-2">
                  {consolidatedData.worstFile.fullName}
                </div>
                <div className="text-4xl font-bold text-yellow-600 mb-2">
                  {consolidatedData.worstFile.quality.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  This file has the most data quality issues. Don't worry - the chat can still help analyze it!
                </div>
              </div>
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  💡 What you can do:
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ask the chat about missing values in this file</li>
                  <li>• Review the audit findings below</li>
                  <li>• Still proceed with analysis - we'll work around issues!</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Getting Started Guide */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">🚀 Ready to Dive In?</h2>
        <p className="text-xl text-blue-100 mb-6">
          Now that you understand your data, here's what you can do next:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-10 rounded-lg p-5 backdrop-blur">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-bold text-lg mb-2">Ask Questions</h3>
            <p className="text-sm text-blue-100">
              Use the chat on the right to ask questions about your data in plain English
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-5 backdrop-blur">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-lg mb-2">Request Charts</h3>
            <p className="text-sm text-blue-100">
              Say "show me a chart of..." to get visual insights instantly
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-5 backdrop-blur">
            <div className="text-4xl mb-3">🎤</div>
            <h3 className="font-bold text-lg mb-2">Use Your Voice</h3>
            <p className="text-sm text-blue-100">
              Click the microphone button to speak your questions instead of typing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
