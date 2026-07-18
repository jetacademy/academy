"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimLessonsCertificate } from "@/app/member/actions";

/** Tombol klaim sertifikat untuk program berkriteria "selesaikan semua materi". */
export default function ClaimCertButton({ registrationId }: { registrationId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClaim() {
    setError(null);
    setLoading(true);
    try {
      const res = await claimLessonsCertificate(registrationId);
      if (res.error) {
        setError(res.error);
      } else if (res.ok && res.certUrl) {
        router.push(res.certUrl);
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "inline-grid", gap: ".6rem", justifyItems: "center" }}>
      <button type="button" className="btn btn-purple btn-lg" onClick={handleClaim} disabled={loading}>
        {loading ? "Menerbitkan…" : "Klaim e-Sertifikat Saya"}
      </button>
      {error && <span style={{ fontSize: ".8rem", color: "var(--red)", fontWeight: 700 }}>{error}</span>}
    </div>
  );
}
