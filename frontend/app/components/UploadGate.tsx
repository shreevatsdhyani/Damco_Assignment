/**
 * Upload Gate - Initial screen requiring file upload before proceeding
 */
"use client";

import { Shield, Upload, CheckCircle2, Circle } from "lucide-react";
import FileUploader from "./FileUploader";


interface UploadGateProps {
  onFileSelect: (file: File) => void;
  uploading: boolean;
  error: string | null;
  pendingFiles: File[];
  onRemovePendingFile: (index: number) => void;
  onUploadAll: () => void;
  filesUploaded: boolean;
}

export default function UploadGate({
  onFileSelect,
  uploading,
  error,
  pendingFiles,
  onRemovePendingFile,
  onUploadAll,
  filesUploaded,
}: UploadGateProps) {
  const criteria = [
    {
      id: 1,
      text: "Upload at least one financial document",
      met: filesUploaded,
    },
    {
      id: 2,
      text: "File must be CSV, XLSX, or XLS format",
      met: pendingFiles.length > 0 || filesUploaded,
    },
    {
      id: 3,
      text: "Data will be analyzed for insights",
      met: filesUploaded,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12" style={{ color: 'var(--accent-primary)' }} />
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>Aegis</h1>
          </div>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Voice-Activated AI CFO
          </p>
        </div>

        {/* Criteria Checklist */}
        <div className="rounded-xl shadow-lg border p-8 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Before You Begin
          </h2>
          <div className="space-y-4 mb-8">
            {criteria.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                {item.met ? (
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-healthy)' }} />
                ) : (
                  <Circle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-disabled)' }} />
                )}
                <span
                  className="text-lg"
                  style={{ color: item.met ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: item.met ? 500 : 400 }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Upload Area */}
          <FileUploader
            onFileSelect={onFileSelect}
            uploading={uploading}
            error={error}
          />

          {/* Pending Files */}
          {pendingFiles.length > 0 && (
            <div className="mt-6">
              <div className="border rounded-lg p-4" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--accent-primary)' }}>
                  Files Ready to Upload ({pendingFiles.length})
                </h3>
                <div className="space-y-2 mb-4">
                  {pendingFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded"
                      style={{ background: 'var(--bg-card)' }}
                    >
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                      <button
                        onClick={() => onRemovePendingFile(index)}
                        style={{ color: 'var(--status-critical)' }}
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={onUploadAll}
                  disabled={uploading}
                  className="w-full px-6 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent-primary)', color: 'var(--text-on-accent)' }}
                >
                  {uploading
                    ? "Uploading..."
                    : `Upload ${pendingFiles.length} File${
                        pendingFiles.length > 1 ? "s" : ""
                      } & Continue`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="border rounded-lg p-6" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>
                100% Data Privacy Guarantee
              </h3>
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>&bull; Your data never leaves the backend server</li>
                <li>&bull; Only schema metadata sent to AI (no actual values)</li>
                <li>&bull; All queries execute in secure sandbox</li>
                <li>&bull; GDPR &amp; compliance ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
