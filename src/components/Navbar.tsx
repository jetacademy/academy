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
          Jetschool <span style={{ color: "var(--purple)" }}>Academy</span>
        </Link>

        {!minimal && (
          <nav className={`nav-links${open ? " open" : ""}`} onClick={() => setOpen(false)}>
            <Link href="/#program">Program</Link>
            <Link href="/#cara">Cara Kerja</Link>
            <Link href="/#faq">FAQ</Link>
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
          <Link href={ctaHref} className="btn btn-purple">{ctaLabel}</Link>
          {!minimal && (
            <button className="nav-burger" aria-label="Buka menu" onClick={() => setOpen(!open)}>☰</button>
          )}
        </div>
      </div>
    </header>
  );
}
