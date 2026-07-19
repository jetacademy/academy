"use client";

import { useState } from "react";
import { initiateCertificateCheckout } from "@/app/member/actions";
import { rupiah } from "@/lib/format";

interface MemberPayCertButtonProps {
  registrationId: string;
  certPrice: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function MemberPayCertButton({
  registrationId,
  certPrice,
  className = "btn btn-purple btn-block",
  style,
}: MemberPayCertButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayClick() {
    setError(null);
    setLoading(true);

    try {
      const res = await initiateCertificateCheckout(registrationId);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch {
      setError("Gagal menyiapkan pembayaran. Coba lagi atau hubungi admin.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.4rem", width: "100%" }}>
      <button
        onClick={handlePayClick}
        disabled={loading}
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          cursor: loading ? "not-allowed" : "pointer",
          ...style,
        }}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                width: "1.1rem",
                height: "1.1rem",
                animation: "spin 1s linear infinite",
              }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                style={{ opacity: 0.25 }}
              />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Menyiapkan Pembayaran...
          </>
        ) : (
          `Klaim Sertifikat (${rupiah(certPrice)})`
        )}
      </button>
      {error && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--red)",
            fontWeight: 700,
            textAlign: "center",
            marginTop: "0.2rem",
          }}
        >
          ⚠️ {error}
        </span>
      )}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
