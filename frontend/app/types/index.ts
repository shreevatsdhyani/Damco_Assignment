/**
 * TypeScript type definitions for Aegis frontend
 */

export type FileType = "csv" | "xlsx" | "xls";

export interface ColumnInfo {
  name: string;
  dtype: string;
  non_null_count: number;
  unique_count: number;
  sample_values: any[];
  min_value?: any;
  max_value?: any;
  mean_value?: number;
}

export interface FileSchema {
  file_id: string;
  filename: string;
  row_count: number;
  column_count: number;
  columns: ColumnInfo[];
  file_type: FileType;
}

export interface AuditFinding {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
  affected_rows: number[];
  details?: Record<string, any>;
}

export interface AuditReport {
  file_id: string;
  total_findings: number;
  findings: AuditFinding[];
  timestamp: string;
}

export interface QueryRequest {
  file_id: string;
  question: string;
  voice_enabled: boolean;
}

export interface QueryResponse {
  answer: string;
  generated_code?: string;
  chart_data?: Record<string, any>;
  audio_url?: string;
}

export interface UploadedFile {
  file_id: string;
  filename: string;
  schema: FileSchema;
  audit_report?: AuditReport;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  audio_url?: string;
  chart_data?: any;
}
