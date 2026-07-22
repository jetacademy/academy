"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  defaultName: string;
  defaultWhatsapp: string;
  defaultEmail: string;
  defaultInstitution: string;
}

export default function EditProfileModal({
  defaultName,
  defaultWhatsapp,
  defaultEmail,
  defaultInstitution,
}: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [name, setName] = useState(defaultName);
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp);
  const [institution, setInstitution] = useState(defaultInstitution);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle native <dialog> open/close — no setState inside
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const openModal = () => {
    // Reset form ke nilai default sebelum buka modal
    setName(defaultName);
    setWhatsapp(defaultWhatsapp);
    setInstitution(defaultInstitution);
    setError("");
    setSuccess("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validasi client side
    if (!name.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }
    if (!whatsapp.trim()) {
      setError("Nomor WhatsApp wajib diisi.");
      return;
    }
    if (!/^08\d{7,12}$/.test(whatsapp.trim())) {
      setError("Format WhatsApp harus 08xxx (minimal 10 digit).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/member/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          institution: institution.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal memperbarui profil.");
        setLoading(false);
        return;
      }

      setSuccess(data.message || "Profil berhasil diperbarui! 🎉");

      // Reload halaman setelah sukses (dengan delay biar user lihat pesan)
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Tombol pemicu */}
      <button
        type="button"
        className="btn btn-line btn-sm"
        onClick={openModal}
      >
        ✏️ Edit Profil
      </button>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "var(--r-md, 12px)",
              padding: "2rem",
              maxWidth: "480px",
              width: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              position: "relative",
              animation: "fadeIn 0.2s ease",
            }}
          >
            {/* Tombol close */}
            <button
              type="button"
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "var(--ink-soft, #888)",
                lineHeight: 1,
              }}
            >
              ×
            </button>

            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.25rem 0" }}>
              Edit Profil
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft, #888)", marginBottom: "1.5rem" }}>
              Perbarui data diri Anda. Email tidak dapat diganti.
            </p>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                  border: "1px solid #fecaca",
                }}
              >
                ❌ {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                style={{
                  background: "#f0fdf4",
                  color: "#16a34a",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                  border: "1px solid #bbf7d0",
                }}
              >
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Nama Lengkap */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="ep-name"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: "0.35rem",
                    color: "var(--ink, #333)",
                  }}
                >
                  Nama Lengkap <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  id="ep-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="Nama lengkap Anda"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    border: "1px solid var(--border, #d1d5db)",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* WhatsApp */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="ep-wa"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: "0.35rem",
                    color: "var(--ink, #333)",
                  }}
                >
                  WhatsApp <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  id="ep-wa"
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                  pattern="08\d{7,12}"
                  maxLength={15}
                  placeholder="08xxxxxxxxxx"
                  title="Format: 08xxxx (minimal 10 digit)"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    border: "1px solid var(--border, #d1d5db)",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Email (read-only) */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="ep-email"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: "0.35rem",
                    color: "var(--ink, #333)",
                  }}
                >
                  Email
                </label>
                <input
                  id="ep-email"
                  type="email"
                  value={defaultEmail}
                  readOnly
                  disabled
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    border: "1px solid var(--border, #d1d5db)",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    background: "#f3f4f6",
                    color: "#6b7280",
                    cursor: "not-allowed",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Asal Lembaga */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="ep-inst"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: "0.35rem",
                    color: "var(--ink, #333)",
                  }}
                >
                  Asal Lembaga
                </label>
                <input
                  id="ep-inst"
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  maxLength={200}
                  placeholder="Nama sekolah / instansi (opsional)"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    border: "1px solid var(--border, #d1d5db)",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Tombol Aksi */}
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-purple btn-sm"
                  disabled={loading}
                  style={{ minWidth: "120px" }}
                >
                  {loading ? "Menyimpan..." : "Simpan Profil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
