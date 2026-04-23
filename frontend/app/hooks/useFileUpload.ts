/**
 * Custom hook for file upload functionality
 */
"use client";

import { useState } from "react";
import apiClient from "../lib/api";
import type { FileSchema, AuditReport } from "../types";

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileSchema | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileSchema[]>([]);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [auditReports, setAuditReports] = useState<Map<string, AuditReport>>(new Map());

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      // Upload file
      const schema = await apiClient.uploadFile(file);
      setUploadedFile(schema);

      // Automatically run audit
      const audit = await apiClient.auditFile(schema.file_id);
      setAuditReport(audit);

      return { schema, audit };
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "File upload failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleFiles = async (files: File[]) => {
    setUploading(true);
    setError(null);

    try {
      console.log(`Uploading ${files.length} files sequentially:`, files.map(f => f.name));

      const schemas: FileSchema[] = [];
      const newAuditReports = new Map<string, AuditReport>();

      // Upload files one by one to avoid large responses
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading file ${i + 1}/${files.length}: ${file.name}`);

        try {
          // Upload single file
          const schema = await apiClient.uploadFile(file);
          schemas.push(schema);

          // Get audit report
          const audit = await apiClient.auditFile(schema.file_id);
          newAuditReports.set(schema.file_id, audit);

          console.log(`✓ File ${i + 1} uploaded successfully:`, file.name);
        } catch (fileErr: any) {
          console.error(`✗ Failed to upload file ${i + 1}:`, file.name, fileErr);
          // Continue with other files
        }
      }

      if (schemas.length === 0) {
        throw new Error("All file uploads failed");
      }

      setUploadedFiles(schemas);
      setAuditReports(newAuditReports);

      // Set the first file as the active one
      setUploadedFile(schemas[0]);
      setAuditReport(newAuditReports.get(schemas[0].file_id) || null);

      console.log(`✓ All done! Uploaded ${schemas.length}/${files.length} files`);

      return schemas;
    } catch (err: any) {
      console.error("Upload error caught:", err);
      const errorMessage = err.message || "File upload failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setUploadedFiles([]);
    setAuditReport(null);
    setAuditReports(new Map());
    setError(null);
  };

  const switchFile = (fileId: string) => {
    const file = uploadedFiles.find(f => f.file_id === fileId);
    if (file) {
      setUploadedFile(file);
      setAuditReport(auditReports.get(fileId) || null);
    }
  };

  return {
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
  };
};
