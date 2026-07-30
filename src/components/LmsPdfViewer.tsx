"use client";

import { useRef, useState } from "react";

/**
 * LmsPdfViewer — PDF viewer yang mencegah download.
 *
 * Strategi:
 * 1. Gunakan Google Docs Viewer embed (tidak ada toolbar download browser).
 * 2. Jika URL adalah file lokal (bukan https), fallback ke native iframe + `#toolbar=0&navpanes=0`.
 * 3. Right-click pada kontainer dikunci (hanya efektif di luar iframe).
 * 4. Tidak ada link download yang ditampilkan.
 *
 * Props:
 *   fileUrl — URL publik ke file PDF
 *   title   — Judul materi (ditampilkan di header)
 */
export default function LmsPdfViewer({
  fileUrl,
  title,
}: {
  fileUrl: string;
  title: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Gunakan Google Docs Viewer hanya untuk URL https — dihitung sekali saat render
  const useGdocs = (() => {
    try {
      return new URL(fileUrl).protocol === "https:";
    } catch {
      return false;
    }
  })();

  const embedSrc = useGdocs
    ? `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(fileUrl)}`
    : `${fileUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;


  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  return (
    <div
      className="lms-pdf-wrapper"
      onContextMenu={handleContextMenu}
    >
      {/* Header */}
      <div className="lms-pdf-header">
        <div className="lms-pdf-header-title">
          <span>📄</span>
          <span
            style={{
              maxWidth: "60vw",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </span>
        </div>
        <div className="lms-pdf-shield">
          🔒 Hanya baca
        </div>
      </div>

      {/* Loading skeleton */}
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            top: 41, // header height
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-panel)",
            gap: "0.8rem",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "2rem",
              height: "2rem",
              border: "3px solid rgba(108,92,231,.2)",
              borderTopColor: "var(--purple)",
              borderRadius: "50%",
              animation: "lms-spin .8s linear infinite",
            }}
          />
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontWeight: 600 }}>
            Memuat dokumen…
          </span>
        </div>
      )}

      {/* iframe PDF */}
      <div style={{ position: "relative" }}>
        <iframe
          ref={iframeRef}
          src={embedSrc}
          className="lms-pdf-frame"
          title={title}
          onLoad={() => setLoaded(true)}
          allow="fullscreen"
          // Mencegah download via attribute (beberapa browser menghormati ini)
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups-to-escape-sandbox allow-popups"
        />
        {/* Transparent overlay di pojok kanan bawah untuk menutup toolbar download */}
        <div className="lms-pdf-overlay" />
      </div>
    </div>
  );
}
