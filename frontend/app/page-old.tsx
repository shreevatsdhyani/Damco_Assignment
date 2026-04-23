/**
 * Aegis - Voice-Activated AI CFO
 * Main application page
 */
"use client";

import { useState } from "react";
import { Shield, X } from "lucide-react";
import FileUploader from "./components/FileUploader";
import FileInfo from "./components/FileInfo";
import AuditPanel from "./components/AuditPanel";
import ChatInterface from "./components/ChatInterface";
import { useFileUpload } from "./hooks/useFileUpload";
import { useChat } from "./hooks/useChat";

export default function Home() {
  const [step, setStep] = useState<"upload" | "audit" | "chat">("upload");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const {
    uploading,
    error,
    uploadedFile,
    uploadedFiles,
    auditReport,
    uploadFile,
    uploadMultipleFiles,
    clearFile,
    switchFile,
  } = useFileUpload();

  const { messages, loading, sendQuery, clearChat } = useChat();

  const handleFileSelect = async (file: File) => {
    setPendingFiles(prev => [...prev, file]);
  };

  const handleUploadAll = async () => {
    if (pendingFiles.length === 0) return;

    try {
      if (pendingFiles.length === 1) {
        // Use single file upload for one file
        await uploadFile(pendingFiles[0]);
      } else {
        // Use multi-file upload for multiple files
        await uploadMultipleFiles(pendingFiles);
      }
      setPendingFiles([]);
      setStep("audit");
    } catch (err: any) {
      console.error("Upload failed:", err);
      console.error("Error details:", err.message, err.response?.data);
    }
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartChat = () => {
    setStep("chat");
  };

  const handleRemoveFile = () => {
    clearFile();
    clearChat();
    setStep("upload");
  };

  const handleSendMessage = async (message: string, voiceEnabled: boolean) => {
    if (!uploadedFile) return;
    try {
      await sendQuery(uploadedFile.file_id, message, voiceEnabled);
    } catch (err) {
      console.error("Query failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Aegis</h1>
                <p className="text-sm text-gray-600">Voice-Activated AI CFO</p>
              </div>
            </div>
            {uploadedFile && (
              <button
                onClick={handleRemoveFile}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Upload New File
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Step Indicator */}
          {uploadedFile && (
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="text-sm font-medium text-gray-900">Upload</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === "audit" || step === "chat"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-sm font-medium ${
                    step === "audit" || step === "chat"
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  Audit
                </span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === "chat"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-sm font-medium ${
                    step === "chat" ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  Chat
                </span>
              </div>
            </div>
          )}

          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Upload Your Financial Data
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Your data stays private. We only analyze the structure, never share raw data with external AI models.
                </p>
              </div>
              <FileUploader
                onFileSelect={handleFileSelect}
                uploading={uploading}
                error={error}
              />

              {/* Pending Files List */}
              {pendingFiles.length > 0 && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Files Ready to Upload ({pendingFiles.length})
                    </h3>
                    <div className="space-y-2 mb-4">
                      {pendingFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            onClick={() => handleRemovePendingFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleUploadAll}
                      disabled={uploading}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? "Uploading..." : `Upload ${pendingFiles.length} File${pendingFiles.length > 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy Guarantee */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">
                        100% Data Privacy Guarantee
                      </h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Raw financial data never leaves the backend</li>
                        <li>• Only schema metadata sent to AI (no actual values)</li>
                        <li>• All queries executed in secure sandbox</li>
                        <li>• GDPR & compliance ready</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Step */}
          {step === "audit" && uploadedFile && auditReport && (
            <div className="space-y-6">
              {/* File Tabs if multiple files */}
              {uploadedFiles.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {uploadedFiles.map((file) => (
                    <button
                      key={file.file_id}
                      onClick={() => switchFile(file.file_id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        file.file_id === uploadedFile.file_id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {file.filename}
                    </button>
                  ))}
                </div>
              )}
              <FileInfo fileSchema={uploadedFile} onRemove={handleRemoveFile} />
              <AuditPanel auditReport={auditReport} />
              <div className="flex justify-center">
                <button
                  onClick={handleStartChat}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Start Asking Questions
                </button>
              </div>
            </div>
          )}

          {/* Chat Step */}
          {step === "chat" && uploadedFile && (
            <div className="space-y-6">
              <FileInfo fileSchema={uploadedFile} />
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
                fileId={uploadedFile.file_id}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Aegis - Privacy-first financial intelligence platform
          </p>
        </div>
      </footer>
    </div>
  );
}
