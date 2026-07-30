"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";

/** Tombol kirim broadcast dengan konfirmasi — mencegah salah kirim. */
export default function BroadcastButton({
  disabled,
  recipientCount,
}: {
  disabled?: boolean;
  recipientCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [wasPending, setWasPending] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  const { pending } = useFormStatus();

  const openModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    formRef.current = e.currentTarget.closest("form");
    setIsOpen(true);
  };

  const closeModal = useCallback(() => {
    if (pending) return;
    setIsOpen(false);
  }, [pending]);

  const handleConfirm = () => {
    if (!formRef.current) return;
    formRef.current.requestSubmit();
  };

  // Tutup otomatis setelah pengiriman selesai (dari true ke false)
  if (pending && !wasPending) {
    setWasPending(true);
  } else if (!pending && wasPending) {
    setWasPending(false);
    setIsOpen(false);
  }

  // Tutup dengan ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeModal]);

  // Lock scroll dan auto-focus batal
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);
    return () => {
      document.body.style.overflow = originalStyle;
      clearTimeout(timer);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="btn btn-yellow"
        style={{ fontWeight: 700, padding: ".6rem 1.6rem", fontSize: ".95rem" }}
        onClick={openModal}
        disabled={disabled || pending}
      >
        {pending ? (
          <>
            <span className="confirm-spinner"></span>
            Mengirim...
          </>
        ) : (
          `📨 Kirim Broadcast${recipientCount > 0 ? ` (${recipientCount} penerima)` : ""}`
        )}
      </button>

      {isOpen && createPortal(
        <div className="confirm-backdrop" onClick={closeModal}>
          <div
            className="confirm-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="confirm-icon-wrap" style={{ background: "#fef3c7" }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#d97706" style={{ width: 32, height: 32 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>

            <h3 className="confirm-title" style={{ fontSize: "1.1rem" }}>
              Konfirmasi Broadcast
            </h3>
            <p className="confirm-desc" style={{ fontSize: ".9rem", lineHeight: 1.6 }}>
              Apakah Anda yakin ingin mengirim broadcast WhatsApp ke <strong>{recipientCount} peserta</strong>?
              <br />
              <span style={{ color: "#dc2626", fontSize: ".85rem" }}>
                ⚠️ Pesan akan langsung terkirim dan tidak dapat dibatalkan.
              </span>
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn confirm-btn-cancel"
                onClick={closeModal}
                disabled={pending}
                ref={cancelButtonRef}
              >
                Batal
              </button>
              <button
                type="button"
                className="confirm-btn"
                style={{
                  background: "#d97706",
                  color: "#fff",
                  fontWeight: 700,
                }}
                onClick={handleConfirm}
                disabled={pending}
              >
                {pending ? (
                  <>
                    <span className="confirm-spinner"></span>
                    Mengirim...
                  </>
                ) : (
                  `Ya, Kirim ke ${recipientCount} Peserta`
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
