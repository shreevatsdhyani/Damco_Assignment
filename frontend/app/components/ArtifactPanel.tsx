/**
 * ArtifactPanel - Sandboxed iframe for rendering dashboard HTML
 */
"use client";

import { useEffect, useRef } from "react";

interface ArtifactPanelProps {
  html: string;
  title?: string;
}

export default function ArtifactPanel({ html, title }: ArtifactPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}>
      {title && (
        <div className="px-4 py-2 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <h3 className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>{title}</h3>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="Dashboard Artifact"
      />
    </div>
  );
}
