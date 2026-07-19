"use client";

import { useRef, useState } from "react";
import { uploadFileAction } from "@/app/webadmin/actions";
import Icon from "@/components/Icon";

/** Upload gambar terkontrol (value/onChange) — dipakai blok "Gambar" di editor halaman program. */
export default function BlockImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("target", "content");
      const res = await uploadFileAction(fd);
      if (res.error || !res.url) {
        setError(res.error ?? "Upload gagal. Coba lagi.");
      } else {
        onChange(res.url);
      }
    } catch {
      setError("Upload gagal (koneksi/server). Coba lagi.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      handleUpload(f);
    }
  };

  return (
    <div className="cbe-image-field">
      <div 
        className={`uploader-area ${dragging ? "dragging" : ""} ${value ? "has-image" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />

        {value ? (
          <div className="uploader-with-image">
            <div className="uploader-image-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau kecil admin */}
              <img src={value} alt="Pratinjau" className="uploader-image-preview" />
              {uploading && (
                <div className="uploader-loading-overlay">
                  <div className="uploader-spinner" />
                  <span>Mengunggah…</span>
                </div>
              )}
            </div>
            <div className="uploader-actions">
              <button
                type="button"
                className="btn btn-sm btn-purple"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Icon name="upload" size={14} />
                {uploading ? "Mengunggah…" : "Ganti Gambar"}
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-danger"
                disabled={uploading}
                onClick={() => onChange("")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Icon name="trash" size={14} />
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="uploader-empty-state"
            onClick={() => inputRef.current?.click()}
            style={{ cursor: uploading ? "wait" : "pointer" }}
          >
            <div className="uploader-icon-circle">
              {uploading ? (
                <div className="uploader-spinner" />
              ) : (
                <Icon name="upload" size={22} />
              )}
            </div>
            <div className="uploader-text-main">
              {uploading ? "Sedang mengunggah gambar..." : "Pilih atau seret berkas gambar ke sini"}
            </div>
            <div className="uploader-text-sub">
              Format PNG, JPEG, atau WebP (Maks. 20MB)
            </div>
          </div>
        )}
      </div>

      {error && <span className="uploader-error-message">{error}</span>}

      <div className="uploader-url-input-group">
        <span className="uploader-url-addon">
          <Icon name="file-text" size={14} />
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder="…atau tempel URL gambar eksternal di sini"
          className="uploader-url-input"
        />
      </div>
    </div>
  );
}
