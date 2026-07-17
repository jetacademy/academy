"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

type Result = {
  paid?: boolean;
  free?: boolean;
  invoiceUrl?: string;
  waGroupLink?: string | null;
  lmsLink?: string | null;
};

/**
 * Satu formulir untuk semua tipe program.
 * - Gratis  : daftar → konfirmasi → ajakan bergabung ke grup WhatsApp.
 * - Berbayar: daftar → diarahkan ke halaman pembayaran Xendit.
 */
export default function RegisterForm({ programSlug, programTitle, jadwal, price, priceLabel }: {
  programSlug: string;
  programTitle: string;
  jadwal: string;
  price: number; // 0 = gratis
  priceLabel: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ name: string } & Result | null>(null);

  const isPaid = price > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("loading");
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      whatsapp: (form.elements.namedItem("whatsapp") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      programSlug,
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: Result & { error?: string } = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Pendaftaran gagal. Silakan coba kembali.");

      if (json.invoiceUrl) {
        window.fbq?.("track", "InitiateCheckout");
        window.location.href = json.invoiceUrl; // halaman pembayaran Xendit
        return;
      }

      window.fbq?.("track", "Lead");
      setResult({ name: data.name, ...json });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kendala. Silakan coba kembali.");
      setState("idle");
    }
  }

  if (state === "done" && result) {
    return (
      <div className="reg-card" style={{ textAlign: "center" }}>
        <span className="dot-btn dot-p" style={{ width: 56, height: 56, margin: "0 auto .9rem" }}>
          <Icon name="check" size={26} />
        </span>
        <h3>{result.paid ? "Pembayaran diterima." : "Pendaftaran berhasil."}</h3>
        <p className="sub" style={{ margin: ".6rem 0 1.4rem" }}>
          Terima kasih, <b>{result.name}</b>. Detail akses telah dikirim ke WhatsApp Anda.
          {result.waGroupLink && <> Silakan bergabung ke grup peserta untuk informasi selanjutnya.</>}
        </p>
        {result.waGroupLink && (
          <a className="btn btn-purple btn-lg btn-block" href={result.waGroupLink} target="_blank" rel="noopener">
            Gabung Grup Peserta
          </a>
        )}
        {result.lmsLink && (
          <a className="btn btn-line btn-block" style={{ marginTop: ".7rem" }} href={result.lmsLink} target="_blank" rel="noopener">
            Buka Materi
          </a>
        )}
      </div>
    );
  }

  return (
    <form className="reg-card" onSubmit={onSubmit}>
      <h3>{isPaid ? "Formulir Pendaftaran" : "Pendaftaran Gratis"}</h3>
      <p className="sub">{programTitle}<br />{jadwal}</p>

      {error && <div className="form-error">{error}</div>}

      <div className="field">
        <label htmlFor="fNama">Nama Lengkap (tercetak di sertifikat)</label>
        <input id="fNama" name="name" type="text" placeholder="contoh: Budi Santoso" required minLength={3} />
      </div>
      <div className="field">
        <label htmlFor="fWa">Nomor WhatsApp Aktif</label>
        <input id="fWa" name="whatsapp" type="tel" placeholder="contoh: 081234567890" pattern="0[0-9]{8,13}" required />
      </div>
      <div className="field">
        <label htmlFor="fEmail">Email</label>
        <input id="fEmail" name="email" type="email" placeholder="contoh: budi@gmail.com" required />
      </div>

      <button type="submit" className="btn btn-purple btn-lg btn-block" disabled={state === "loading"}>
        {state === "loading"
          ? "Memproses..."
          : isPaid ? `Daftar & Bayar — ${priceLabel}` : "Daftar Sekarang"}
      </button>
      <p className="reg-note">
        {isPaid
          ? "Pembayaran diproses aman melalui Xendit — QRIS, transfer bank, dan e-wallet."
          : "Data Anda aman. Tautan akses dikirim otomatis melalui WhatsApp."}
      </p>
    </form>
  );
}
