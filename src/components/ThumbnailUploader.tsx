"use client";

import { useId, useRef, useState } from "react";
import { uploadFileAction } from "@/app/webadmin/actions";

/** Upload gambar thumbnail program (PNG/JPG/WebP, maks 20 MB) — atau tempel URL eksternal. */
export default function ThumbnailUploader({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [imageUrl, setImageUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadFileAction(fd);
      if (res.error || !res.url) {
        setError(res.error ?? "Upload gagal. Coba lagi.");
      } else {
        setImageUrl(res.url);
      }
    } catch {
      setError("Upload gagal (koneksi/server). Coba lagi.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="field">
      <label>Gambar Program</label>
      <input type="hidden" name={name} value={imageUrl} />
      <div className="upload-box">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau admin, bisa URL eksternal apa saja
          <img
            src={imageUrl}
            alt="Pratinjau gambar program"
            style={{ width: 96, height: 54, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "var(--chip)" }}
          />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          id={`${uid}-thumb`}
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
        <label htmlFor={`${uid}-thumb`} className="btn btn-sm btn-purple" style={{ cursor: uploading ? "wait" : "pointer" }}>
          {uploading ? "Mengunggah…" : imageUrl ? "Ganti Gambar" : "Upload Gambar"}
        </label>
        {imageUrl && !uploading && (
          <button type="button" className="btn btn-sm" onClick={() => setImageUrl("")}>Hapus</button>
        )}
      </div>
      {error && (
        <span style={{ display: "block", marginTop: ".4rem", fontSize: ".78rem", color: "var(--red)", fontWeight: 700 }}>{error}</span>
      )}
      <input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value.trim())}
        placeholder="…atau tempel URL gambar eksternal di sini"
        style={{ marginTop: ".6rem" }}
      />
      <span className="adm-note">Rasio disarankan 16:9 (mis. 1200×675) — dipakai di halaman program, kartu katalog, &amp; pratinjau share medsos.</span>
    </div>
  );
}
