"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser, memberVerifyOtp } from "../member/actions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function DaftarPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [otpCode, setOtpCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await registerUser(form);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else if (res?.ok && res.userId) {
      setUserId(res.userId);
      setUserEmail(String(form.get("email") ?? "").trim());
      setStep("otp");
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError(null);
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setError("Masukkan kode OTP dengan benar.");
      return;
    }
    setLoading(true);
    const res = await memberVerifyOtp(userEmail, otpCode.trim());
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else if (res?.ok) {
      setStep("done");
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <>
        <Navbar minimal ctaHref="/member" ctaLabel="Ke Dashboard" />
        <section className="section" style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
          <div style={{ width: "min(28rem, 92%)" }}>
            <div className="reg-card" style={{ textAlign: "center" }}>
              <div style={{
                width: "3.5rem", height: "3.5rem", borderRadius: "50%",
                background: "var(--green, #17A05E)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.8rem", margin: "0 auto 1rem"
              }}>✓</div>
              <h3>Akun berhasil dibuat!</h3>
              <p className="sub" style={{ margin: "0.8rem 0 1.5rem" }}>
                Selamat datang, {userEmail}. Silakan lanjutkan ke dashboard untuk melihat program.
              </p>
              <Link href="/member" className="btn btn-purple btn-lg btn-block" style={{ width: "100%" }}>
                Buka Dashboard
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar minimal ctaHref="/member/login" ctaLabel="Login" />

      <section className="section" style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
        <div style={{ width: "min(28rem, 92%)" }}>
          <div className="reg-card reveal in">
            <h3 style={{ textAlign: "center", marginBottom: "0.3rem" }}>Buat Akun Baru</h3>
            <p className="sub" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              Daftar gratis — dapatkan akses ke semua program Jetschool Academy.
            </p>

            {error && <div className="form-error" style={{ marginBottom: "1rem", fontSize: "0.82rem" }}>{error}</div>}

            {step === "form" && (
              <form onSubmit={handleRegister}>
                <div className="field">
                  <label htmlFor="fName">Nama Lengkap</label>
                  <input id="fName" name="name" type="text" placeholder="Contoh: Budi Santoso" required minLength={3} />
                </div>
                <div className="field">
                  <label htmlFor="fEmail">Email</label>
                  <input id="fEmail" name="email" type="email" placeholder="contoh@email.com" required />
                </div>
                <div className="field">
                  <label htmlFor="fWa">Nomor WhatsApp Aktif</label>
                  <input id="fWa" name="whatsapp" type="tel" placeholder="Contoh: 081234567890" pattern="0[0-9]{8,13}" required />
                </div>
                <button type="submit" className="btn btn-purple btn-lg btn-block" disabled={loading} style={{ width: "100%", marginTop: "0.5rem" }}>
                  {loading ? "Memproses..." : "Daftar & Kirim OTP"}
                </button>
                <p style={{ textAlign: "center", marginTop: "1.2rem", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                  Sudah punya akun?{' '}
                  <Link href="/member/login" style={{ color: "var(--purple)", fontWeight: 700 }}>Login</Link>
                </p>
              </form>
            )}

            {step === "otp" && (
              <div>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "1.2rem", textAlign: "center" }}>
                  Kode OTP telah dikirim ke <strong>{userEmail}</strong> via WhatsApp
                </p>
                <div className="field">
                  <label htmlFor="fOtp">Kode OTP (6 digit)</label>
                  <input
                    id="fOtp" type="text" inputMode="numeric" autoComplete="one-time-code"
                    placeholder="Contoh: 482916" maxLength={6}
                    value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    disabled={loading} autoFocus
                  />
                </div>
                <button type="button" className="btn btn-purple btn-lg btn-block" disabled={loading} style={{ width: "100%" }} onClick={handleVerifyOtp}>
                  {loading ? "Memverifikasi..." : "Verifikasi & Masuk"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
