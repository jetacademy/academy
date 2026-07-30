"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Gunakan worker dari CDN (sesuai versi pdfjs-dist yang di-bundle react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * LmsPdfViewer — PDF viewer menggunakan react-pdf (PDF.js).
 * - Render tiap halaman sebagai <canvas> → tidak ada toolbar download browser
 * - Tidak ada link download yang ditampilkan
 * - Navigasi halaman (prev/next)
 * - Konteks kanan diblokir pada kontainer
 */
export default function LmsPdfViewer({
  fileUrl,
  title,
}: {
  fileUrl: string;
  title: string;
}) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(700);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const ro = new ResizeObserver(([entry]) => {
        setContainerWidth(Math.floor(entry.contentRect.width));
      });
      ro.observe(node);
    }
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError() {
    setLoading(false);
    setError("Gagal memuat dokumen PDF. Silakan coba lagi.");
  }

  function prevPage() {
    setPageNumber((p) => Math.max(1, p - 1));
  }

  function nextPage() {
    setPageNumber((p) => Math.min(numPages, p + 1));
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  return (
    <div
      className="lms-pdf-wrapper"
      onContextMenu={handleContextMenu}
      style={{ userSelect: "none" }}
    >
      {/* Header */}
      <div className="lms-pdf-header">
        <div className="lms-pdf-header-title">
          <span>📄</span>
          <span
            style={{
              maxWidth: "55vw",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </span>
        </div>
        <div className="lms-pdf-shield">🔒 Hanya baca</div>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 1rem",
            gap: "0.8rem",
            background: "var(--bg-panel)",
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

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "var(--red, #e5484d)",
            fontSize: "0.88rem",
            fontWeight: 600,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* PDF Canvas Area */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "72vh",
          background: "#525659",
          display: loading || error ? "none" : "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1rem 0",
          gap: "0.75rem",
        }}
      >
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          noData={null}
        >
          <Page
            key={`page_${pageNumber}`}
            pageNumber={pageNumber}
            width={Math.min(containerWidth - 32, 900)}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={null}
          />
        </Document>
      </div>

      {/* Navigasi halaman */}
      {!loading && !error && numPages > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            padding: "0.65rem 1rem",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-panel)",
          }}
        >
          <button
            type="button"
            onClick={prevPage}
            disabled={pageNumber <= 1}
            style={{
              padding: "0.35rem 0.9rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              borderRadius: "var(--r-sm)",
              border: "1.5px solid var(--border)",
              background: pageNumber <= 1 ? "var(--chip)" : "var(--white)",
              color: pageNumber <= 1 ? "var(--ink-faint)" : "var(--ink)",
              cursor: pageNumber <= 1 ? "not-allowed" : "pointer",
              transition: "all .15s",
            }}
          >
            ← Sebelumnya
          </button>

          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-soft)", minWidth: "5rem", textAlign: "center" }}>
            {pageNumber} / {numPages}
          </span>

          <button
            type="button"
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            style={{
              padding: "0.35rem 0.9rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              borderRadius: "var(--r-sm)",
              border: "1.5px solid var(--border)",
              background: pageNumber >= numPages ? "var(--chip)" : "var(--purple)",
              color: pageNumber >= numPages ? "var(--ink-faint)" : "#fff",
              cursor: pageNumber >= numPages ? "not-allowed" : "pointer",
              transition: "all .15s",
            }}
          >
            Berikutnya →
          </button>
        </div>
      )}
    </div>
  );
}
