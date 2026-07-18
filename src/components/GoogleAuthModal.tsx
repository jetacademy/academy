/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (email: string, name: string, credential?: string) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

const MOCK_ACCOUNTS = process.env.NODE_ENV === 'production' ? [] : [
  { name: "Budi Santoso", email: "budi.santoso@gmail.com" },
  { name: "Arif Pratama", email: "arif.pratama@gmail.com" },
  { name: "Nadia Rahma", email: "nadia.rahma@gmail.com" },
];

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function GoogleAuthModal({ isOpen, onClose, onSelect }: GoogleAuthModalProps) {
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Load Google Client SDK
  useEffect(() => {
    if (!isOpen) return;

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, [isOpen]);

  // Initialize and render official button if client ID is present
  useEffect(() => {
    if (!isOpen || !scriptLoaded || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          const payload = decodeJwt(response.credential);
          if (payload && payload.email) {
            // kirim credential mentah — verifikasi dilakukan di server
            onSelect(payload.email, payload.name || "", response.credential);
          }
        },
      });

      // Render button
      const btnContainer = document.getElementById("google-signin-btn");
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "signin_with",
          shape: "rectangular",
        });
      }
    } catch (e) {
      console.error("Google Sign-In initialization failed:", e);
    }
  }, [isOpen, scriptLoaded, clientId, onSelect]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)",
      animation: "fadeIn 0.2s ease-out"
    }}>
      <div style={{
        background: "var(--white)",
        width: "min(28rem, 92%)",
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
        overflow: "hidden",
        border: "1px solid var(--border)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        {/* Header */}
        <div style={{ padding: "1.8rem 1.8rem 1rem", textAlign: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginBottom: "0.8rem" }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 600, margin: "0 0 0.4rem", color: "#202124" }}>
            {clientId ? "Masuk dengan Google" : "Pilih Akun Google"}
          </h3>
          <p style={{ fontSize: "0.82rem", color: "#5f6368", margin: 0 }}>
            untuk melanjutkan ke <b>Jetschool Academy</b>
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "0 1.8rem 1.8rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {clientId ? (
            /* REAL GOOGLE AUTH IF CLIENT ID IS PRESENT */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", width: "100%", padding: "1.5rem 0" }}>
              <div id="google-signin-btn" style={{ minHeight: "40px" }}></div>
              <p style={{ fontSize: "0.75rem", color: "#5f6368", textAlign: "center", lineHeight: 1.4 }}>
                Tombol di atas terhubung langsung dengan server autentikasi resmi Google.
              </p>
            </div>
          ) : (
            /* CONFIGURATION BOX & MOCK FALLBACK IF CLIENT ID IS MISSING */
            <div style={{ width: "100%" }}>
              <div style={{
                background: "#fff9db",
                border: "1px solid #ffe066",
                borderRadius: "8px",
                padding: "0.8rem",
                marginBottom: "1.2rem",
                fontSize: "0.78rem",
                color: "#856404",
                lineHeight: 1.4
              }}>
                <strong>💡 Info Developer:</strong> Google Client ID belum diatur di file <code>.env</code>.<br />
                Tambahkan <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID=&quot;CLIENT_ID_ANDA&quot;</code> di <code>.env</code> untuk mengaktifkan pop-up Google asli.<br />
                <span style={{ display: "block", marginTop: "0.4rem", fontWeight: 600 }}>
                  Gunakan akun simulasi di bawah untuk uji coba:
                </span>
              </div>

              {!showCustom ? (
                <div style={{ display: "grid", gap: "0.6rem" }}>
                  {MOCK_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => onSelect(acc.email, acc.name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.8rem",
                        width: "100%",
                        padding: "0.8rem 1rem",
                        background: "transparent",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "var(--purple)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.9rem"
                      }}>
                        {acc.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#3c4043" }}>{acc.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#5f6368" }}>{acc.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "1rem 1.8rem",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ fontSize: "0.72rem", color: "#5f6368" }}>Hubungan Aman & Terenkripsi</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#1a73e8",
              cursor: "pointer",
              fontSize: "0.78rem",
              fontWeight: 600
            }}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
