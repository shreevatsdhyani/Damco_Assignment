/**
 * File uploader component
 * Allows users to drag-and-drop or select financial files
 */
"use client";

import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  uploading: boolean;
  error?: string | null;
}

export default function FileUploader({
  onFileSelect,
  uploading,
  error,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach(file => {
          onFileSelect(file);
        });
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files.length > 0) {
        Array.from(e.target.files).forEach(file => {
          onFileSelect(file);
        });
      }
    },
    [onFileSelect]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative"
      >
        <label
          htmlFor="file-upload"
          className={`
            flex flex-col items-center justify-center
            w-full h-64 border-2 border-dashed rounded-lg
            cursor-pointer transition-colors
            ${uploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
          style={{
            borderColor: dragActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
            background: dragActive ? 'var(--bg-app)' : 'var(--bg-card)',
            boxShadow: dragActive ? '0 0 20px var(--shadow-glow)' : 'none',
          }}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: 'var(--accent-primary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Uploading and analyzing...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mb-4" style={{ color: 'var(--text-disabled)' }} />
                <p className="mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  CSV, XLSX, or XLS (MAX. 50MB)
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-disabled)' }}>
                  Stripe exports &bull; Gusto payroll &bull; Bank statements
                </p>
              </>
            )}
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleChange}
            disabled={uploading}
            multiple
          />
        </label>
      </form>

      {error && (
        <div className="mt-4 p-4 border rounded-lg flex items-start gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--status-critical)' }}>
          <X className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-critical)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--status-critical)' }}>Upload Failed</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
