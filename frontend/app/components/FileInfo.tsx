/**
 * File information display component
 * Shows uploaded file details and schema
 */
"use client";

import { FileSpreadsheet, X, Database } from "lucide-react";
import type { FileSchema } from "../types";

interface FileInfoProps {
  fileSchema: FileSchema;
  onRemove?: () => void;
}

export default function FileInfo({ fileSchema, onRemove }: FileInfoProps) {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-blue-500" />
          <div>
            <h3 className="font-semibold text-gray-900">{fileSchema.filename}</h3>
            <p className="text-sm text-gray-600">
              {fileSchema.row_count.toLocaleString()} rows •{" "}
              {fileSchema.column_count} columns
            </p>
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-gray-500" />
          <h4 className="text-sm font-medium text-gray-700">Schema Overview</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fileSchema.columns.slice(0, 6).map((col, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="font-medium text-sm text-gray-900 mb-1">
                {col.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                  {col.dtype}
                </span>
                <span>{col.non_null_count.toLocaleString()} non-null</span>
              </div>
              {col.mean_value !== undefined && col.mean_value !== null && (
                <div className="text-xs text-gray-500 mt-1">
                  Mean: {col.mean_value.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
        {fileSchema.columns.length > 6 && (
          <p className="text-xs text-gray-500 mt-2">
            + {fileSchema.columns.length - 6} more columns
          </p>
        )}
      </div>
    </div>
  );
}
