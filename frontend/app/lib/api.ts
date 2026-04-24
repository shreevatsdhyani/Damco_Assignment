/**
 * API client for Aegis backend
 */
import axios from "axios";
import type {
  FileSchema,
  AuditReport,
  QueryRequest,
  QueryResponse,
  BriefingResponse,
  HealthScoreResponse,
  ScenarioResponse,
  DashboardResponse,
} from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiClient = {
  /**
   * Health check
   */
  health: async () => {
    const response = await api.get("/api/health");
    return response.data;
  },

  /**
   * Upload a file
   */
  uploadFile: async (file: File): Promise<FileSchema> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<FileSchema>("/api/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /**
   * Upload multiple files at once
   */
  uploadMultipleFiles: async (files: File[]): Promise<FileSchema[]> => {
    console.log("API: Uploading files:", files);

    const formData = new FormData();
    files.forEach((file, index) => {
      console.log(`API: Appending file ${index}:`, file.name, file.type, file.size);
      formData.append("files", file);
    });

    console.log("API: FormData created, sending request...");

    try {
      const response = await api.post<FileSchema[]>("/api/files/upload-multiple", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("API: Upload successful:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("API: Upload failed:", error);
      console.error("API: Error response:", error.response?.data);
      throw error;
    }
  },

  /**
   * Get audit report for a file
   */
  auditFile: async (fileId: string): Promise<AuditReport> => {
    const response = await api.get<AuditReport>(`/api/files/audit/${fileId}`);
    return response.data;
  },

  /**
   * List all uploaded files
   */
  listFiles: async () => {
    const response = await api.get("/api/files/list");
    return response.data;
  },

  /**
   * Delete a file
   */
  deleteFile: async (fileId: string) => {
    const response = await api.delete(`/api/files/${fileId}`);
    return response.data;
  },

  /**
   * Execute a query
   */
  executeQuery: async (request: QueryRequest): Promise<QueryResponse> => {
    const response = await api.post<QueryResponse>(
      "/api/query/execute",
      request
    );
    return response.data;
  },

  /**
   * Synthesize speech from text
   */
  synthesizeSpeech: async (text: string, voice: string = "en-US-AriaNeural") => {
    const response = await api.post(
      "/api/tts/synthesize",
      { text, voice },
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  /**
   * Get available TTS voices
   */
  getVoices: async () => {
    const response = await api.get("/api/tts/voices");
    return response.data;
  },

  /**
   * Generate executive briefing
   */
  generateBriefing: async (fileIds: string[]): Promise<BriefingResponse> => {
    const response = await api.post<BriefingResponse>("/api/cfo/briefing", {
      file_ids: fileIds,
    });
    return response.data;
  },

  /**
   * Get financial health score
   */
  getHealthScore: async (): Promise<HealthScoreResponse> => {
    const response = await api.get<HealthScoreResponse>("/api/cfo/health-score");
    return response.data;
  },

  /**
   * Run what-if scenario
   */
  runScenario: async (fileId: string, scenario: string): Promise<ScenarioResponse> => {
    const response = await api.post<ScenarioResponse>("/api/cfo/scenario", {
      file_id: fileId,
      scenario,
    });
    return response.data;
  },

  /**
   * Generate dynamic AI dashboard
   */
  generateDashboard: async (fileIds: string[]): Promise<DashboardResponse> => {
    const response = await api.post<DashboardResponse>("/api/cfo/dashboard", {
      file_ids: fileIds,
    });
    return response.data;
  },

  /**
   * Get AI-generated suggestions and scenario presets
   */
  getSuggestions: async (
    fileIds: string[],
    lastQuestion?: string,
    lastAnswer?: string
  ): Promise<{ questions: string[]; scenarios: string[] }> => {
    const response = await api.post("/api/cfo/suggestions", {
      file_ids: fileIds,
      last_question: lastQuestion || null,
      last_answer: lastAnswer || null,
    });
    return response.data;
  },
};

export default apiClient;
