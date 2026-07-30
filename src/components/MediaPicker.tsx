"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMediaGallery } from "@/app/webadmin/actions";
import MediaGrid from "./MediaGrid";

type MediaItem = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
};

/**
 * MediaPicker — dialog/modal yang menampilkan grid media gallery.
 * Props:
 *   programId — ID program untuk mengambil media
 *   onSelect(url) — callback saat user memilih file
 *   trigger — optional ReactNode untuk tombol buka (default: "Pilih dari Gallery")
 */
export default function MediaPicker({
  programId,
  onSelect,
  trigger,
}: {
  programId: string;
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMediaGallery(programId);
      setMedia(data);
    } catch (err) {
      console.error("[MediaPicker] Gagal memuat media:", err);
      setError("Gagal memuat media. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [programId]);

  function handleOpen() {
    setOpen(true);
    loadMedia();
  }

  function handleClose() {
    setOpen(false);
    setMedia([]);
  }

  function handleSelect(url: string) {
    onSelect(url);
    handleClose();
  }

  // Native dialog API — buka/tutup
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  // Tutup dialog saat klik backdrop
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    function onClick(e: MouseEvent) {
      if (e.target === el) handleClose();
    }
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [open]);

  // Keyboard: Escape tutup dialog
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Trigger button */}
      <span onClick={handleOpen} style={{ cursor: "pointer" }}>
        {trigger ?? (
          <button type="button" className="btn btn-sm">
            📁 Pilih dari Gallery
          </button>
        )}
      </span>

      {/* Dialog */}
      <dialog
        ref={dialogRef}
        style={{
          width: "min(90vw, 800px)",
          maxHeight: "80vh",
          border: "none",
          borderRadius: "var(--r-lg, 12px)",
          padding: 0,
          boxShadow: "0 8px 32px rgba(0,0,0,.2)",
          background: "var(--bg, #fff)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: "80vh",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem 1.2rem",
              borderBottom: "1px solid var(--chip, #eee)",
            }}
          >
            <h3 style={{ fontSize: "1rem", margin: 0 }}>Pilih Media dari Gallery</h3>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleClose}
              style={{ fontSize: ".8rem" }}
            >
              ✕ Tutup
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "1rem 1.2rem",
            }}
          >
            {loading && (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                Memuat media…
              </div>
            )}

            {error && (
              <div
                className="adm-alert err"
                style={{ marginBottom: "1rem" }}
              >
                {error}
              </div>
            )}

            {!loading && !error && (
              <MediaGrid
                programId={programId}
                media={media}
                selectable
                onSelect={handleSelect}
              />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
