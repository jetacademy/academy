"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

/**
 * Navbar 2 mode:
 * - full    : beranda — 2 tautan + 1 CTA
 * - minimal : halaman iklan — hanya logo + 1 CTA (fokus closing)
 */
export default function Navbar({ minimal = false, ctaHref = "/#program", ctaLabel = "Lihat Program" }: {
  minimal?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <Image
            src="/iconjetschool academy.png"
            alt="Jetschool Academy"
            width={44}
            height={44}
            style={{ objectFit: "contain" }}
          />
          Jetschool <span className="nav-brand-suffix" style={{ color: "var(--purple)" }}>Academy</span>
        </Link>

        {!minimal && (
          <nav className={`nav-links${open ? " open" : ""}`} onClick={() => setOpen(false)}>
            <Link href="/#program">Program</Link>
            <Link href="/#cara">Cara Kerja</Link>
            <Link href="/#faq">FAQ</Link>
          </nav>
        )}

        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
          {!minimal && (
            <Link
              href="/member"
              title="Dashboard Peserta"
              className="nav-user-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(108, 92, 231, 0.08)",
                border: "1px solid var(--purple)",
                color: "var(--purple)",
                transition: "all 0.25s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--purple)";
                e.currentTarget.style.color = "var(--white)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(108, 92, 231, 0.08)";
                e.currentTarget.style.color = "var(--purple)";
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>
          )}

          <Link href={ctaHref} className="btn btn-purple">
            <span className="btn-text-desktop">{ctaLabel}</span>
            <span className="btn-text-mobile">Program</span>
          </Link>
          {!minimal && (
            <button className="nav-burger" aria-label="Buka menu" onClick={() => setOpen(!open)}>☰</button>
          )}
        </div>
      </div>
    </header>
  );
}
