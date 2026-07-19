"use client";

import { useRef, useState } from "react";
import { uploadFileAction } from "@/app/webadmin/actions";

/** Upload gambar terkontrol (value/onChange) — dipakai blok "Gambar" di editor halaman program. */
export default function BlockImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className="cbe-image-field">
      <div className="upload-box">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau kecil admin
          <img src={value} alt="Pratinjau" style={{ width: 96, height: 54, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "var(--chip)" }} />
        )}
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
        <button
          type="button"
          className="btn btn-sm btn-purple"
          style={{ cursor: uploading ? "wait" : "pointer" }}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Mengunggah…" : value ? "Ganti Gambar" : "Upload Gambar"}
        </button>
        {value && !uploading && (
          <button type="button" className="btn btn-sm" onClick={() => onChange("")}>Hapus</button>
        )}
      </div>
      {error && <span style={{ display: "block", marginTop: ".4rem", fontSize: ".78rem", color: "var(--red)", fontWeight: 700 }}>{error}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="…atau tempel URL gambar eksternal di sini"
        style={{ marginTop: ".6rem" }}
      />
    </div>
  );
}
