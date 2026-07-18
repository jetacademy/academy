"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { memberLogin, memberLoginWithGoogle } from "../actions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleAuthModal from "@/components/GoogleAuthModal";
import Image from "next/image";

export default function MemberLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleOpen, setGoogleOpen] = useState(false);
  const router = useRouter();

  async function handleGoogleSelect(email: string, _name: string, credential?: string) {
    setGoogleOpen(false);
    setError(null);
    setLoading(true);

    try {
      let res: { ok?: boolean; error?: string } | undefined;

      if (credential) {
        // Token Google asli → verifikasi di server
        res = await memberLoginWithGoogle(credential);
      } else {
        // Mode dev tanpa credential
        res = await memberLogin(email);
      }

      if (res?.error) {
        setError(res.error);
      } else if (res?.ok) {
        router.push("/member");
      } else {
        setError("Terjadi kesalahan tak terduga. Silakan coba lagi.");
      }
    } catch (err: unknown) {
      console.error("[Google login error]", err);
      setError("Koneksi gagal. Periksa jaringan Anda dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar minimal ctaHref="/#program" ctaLabel="Kembali" />

      <section className="section" style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
        <div style={{ width: "min(28rem, 92%)" }}>
          <div className="reg-card reveal in">
            <div className="brand" style={{ justifyContent: "center", marginBottom: "1.2rem" }}>
              <Image
                src="/iconjetschool academy.png"
                alt="Jetschool Academy"
                width={40}
                height={40}
                style={{ objectFit: "contain" }}
              />
              Jetschool <small style={{ color: "var(--purple)", fontSize: ".7rem", fontWeight: 800 }}>MEMBER</small>
            </div>
            <h3 style={{ textAlign: "center" }}>Dashboard Peserta</h3>
            <p className="sub" style={{ textAlign: "center", marginBottom: "2rem" }}>Masuk untuk mengakses materi kelas, link Zoom, tes, dan mengunduh e-sertifikat Anda.</p>

            {error && <div className="form-error" style={{ fontSize: "0.82rem", marginBottom: "1.5rem" }}>{error}</div>}

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
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 18 18" style={{ filter: "brightness(0) invert(1)" }}>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.938 5.48 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.96H.957C.347 6.173 0 7.549 0 9s.347 2.827.957 4.04l3.007-2.333z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.844 11.426 0 9 0 5.48 0 2.438 2.062.957 4.96l3.007 2.333C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </button>

            <p className="reg-note" style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: 0 }}>
              Pastikan Anda menggunakan akun Google yang sama dengan yang didaftarkan.
            </p>
          </div>
        </div>
      </section>

      <GoogleAuthModal
        isOpen={googleOpen}
        onClose={() => setGoogleOpen(false)}
        onSelect={handleGoogleSelect}
        title="Login"
      />

      <Footer />
    </>
  );
}
