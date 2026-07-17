"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import GoogleAuthModal from "@/components/GoogleAuthModal";
import { useRouter } from "next/navigation";
import { memberLogin } from "@/app/member/actions";

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
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleSelected, setGoogleSelected] = useState(false);
  const router = useRouter();

  const [nameVal, setNameVal] = useState("");
  const [emailVal, setEmailVal] = useState("");

  const isPaid = price > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("loading");
    const form = e.currentTarget;
    const data = {
      name: nameVal.trim(),
      whatsapp: (form.elements.namedItem("whatsapp") as HTMLInputElement).value.trim(),
      email: emailVal.trim(),
      institution: (form.elements.namedItem("institution") as HTMLInputElement).value.trim(),
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

      // Auto login setelah registrasi sukses
      try {
        await memberLogin(emailVal.trim());
      } catch (err) {
        console.error("Gagal auto-login:", err);
      }

      if (json.invoiceUrl) {
        window.fbq?.("track", "InitiateCheckout");
        window.location.href = json.invoiceUrl; // halaman pembayaran Xendit
        return;
      }

      window.fbq?.("track", "Lead");
      router.push("/member");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kendala. Silakan coba kembali.");
      setState("idle");
    }
  }

  function handleGoogleSelect(email: string, name: string) {
    setGoogleOpen(false);
    setNameVal(name);
    setEmailVal(email);
    setGoogleSelected(true);
  }

  function handleResetGoogle() {
    setNameVal("");
    setEmailVal("");
    setGoogleSelected(false);
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
    <>
      <div className="reg-card">
        {/* STEP 1: Belum terhubung dengan Google */}
        {!googleSelected ? (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <h3 style={{ marginBottom: "0.4rem" }}>Amankan Kursi Anda</h3>
            <p className="sub" style={{ marginBottom: "1.6rem" }}>
              {programTitle}<br />{jadwal}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Untuk mempermudah proses verifikasi dan keamanan akun, silakan daftar menggunakan akun Google Anda.
            </p>

            <button
              type="button"
              className="btn btn-purple btn-lg btn-block"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                fontWeight: 700,
                width: "100%",
                padding: "0.9rem",
                borderRadius: "var(--r-sm)"
              }}
              onClick={() => setGoogleOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 18 18" style={{ filter: "brightness(0) invert(1)" }}>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.938 5.48 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.96H.957C.347 6.173 0 7.549 0 9s.347 2.827.957 4.04l3.007-2.333z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.844 11.426 0 9 0 5.48 0 2.438 2.062.957 4.96l3.007 2.333C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Daftar dengan Google
            </button>
          </div>
        ) : (
          /* STEP 2: Sudah terhubung, lakukan Onboarding */
          <form onSubmit={onSubmit}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              background: "rgba(108, 92, 231, 0.05)",
              padding: "0.6rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid rgba(108, 92, 231, 0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71" }}></div>
                <span style={{ fontSize: "0.75rem", color: "var(--purple)", fontWeight: 700 }}>
                  Terhubung: {emailVal}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetGoogle}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ink-soft)",
                  fontSize: "0.72rem",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Ganti Akun
              </button>
            </div>

            <h3 style={{ marginBottom: "0.2rem" }}>Lengkapi Profil Anda</h3>
            <p className="sub" style={{ marginBottom: "1.2rem" }}>Isi formulir singkat ini untuk menyelesaikan pendaftaran.</p>

            {error && <div className="form-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <div className="field">
              <label htmlFor="fNama">Nama Lengkap (untuk di sertifikat)</label>
              <input
                id="fNama"
                name="name"
                type="text"
                placeholder="Contoh: Budi Santoso, S.Pd."
                required
                minLength={3}
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="fWa">Nomor WhatsApp Aktif</label>
              <input id="fWa" name="whatsapp" type="tel" placeholder="Contoh: 081234567890" pattern="0[0-9]{8,13}" required />
            </div>

            <div className="field">
              <label htmlFor="fInst">Asal Lembaga / Instansi</label>
              <input id="fInst" name="institution" type="text" placeholder="Contoh: SDN 1 Bandung / Umum" required />
            </div>

            <button type="submit" className="btn btn-purple btn-lg btn-block" disabled={state === "loading"} style={{ width: "100%" }}>
              {state === "loading"
                ? "Memproses..."
                : isPaid ? `Konfirmasi & Bayar — ${priceLabel}` : "Konfirmasi & Daftar"}
            </button>
          </form>
        )}
      </div>

      <GoogleAuthModal
        isOpen={googleOpen}
        onClose={() => setGoogleOpen(false)}
        onSelect={handleGoogleSelect}
        title="Daftar"
      />
    </>
  );
}
