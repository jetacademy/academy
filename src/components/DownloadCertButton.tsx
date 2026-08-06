"use client";

import { useState } from "react";

/** Tombol download sertifikat sebagai PNG resolusi tinggi (ganti alur cetak/print-to-PDF lama). */
export default function DownloadCertButton({ fileName = "sertifikat" }: { fileName?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    const node = document.querySelector<HTMLElement>(".cert-a4");
    if (!node) {
      alert("Elemen sertifikat tidak ditemukan di halaman ini.");
      return;
    }
    setLoading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileName}.png`;
      a.click();
    } catch (err) {
      alert("Gagal membuat gambar sertifikat: " + (err instanceof Error ? err.message : "kesalahan tak dikenal."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn btn-yellow btn-lg" onClick={handleDownload} disabled={loading}>
      {loading ? "Menyiapkan PNG..." : "Download Sertifikat (PNG)"}
    </button>
  );
}
