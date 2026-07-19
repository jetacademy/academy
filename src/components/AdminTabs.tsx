"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const TABS = [
  { href: "/webadmin", label: "Dashboard" },
  { href: "/webadmin/program", label: "Program" },
  { href: "/webadmin/kategori", label: "Kategori" },
  { href: "/webadmin/artikel", label: "Artikel" },
  { href: "/webadmin/pendaftar", label: "Pendaftar" },
  { href: "/webadmin/sertifikat", label: "Sertifikat" },
  { href: "/webadmin/user", label: "User" },
  { href: "/webadmin/integrasi", label: "Integrasi API" },
];

/**
 * Nav utama panel admin. Di desktop tampil satu baris (tab + tombol aksi).
 * Di mobile menciut jadi tombol hamburger yang membuka panel dropdown
 * berisi tab + tombol aksi (dikirim lewat children dari layout).
 */
export default function AdminTabs({ children }: { children?: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="adm-burger"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "☰"}
      </button>
      <div className={`adm-nav-panel${open ? " open" : ""}`} onClick={() => setOpen(false)}>
        <nav className="adm-tabs">
          {TABS.map((t) => {
            const on = t.href === "/webadmin" ? path === "/webadmin" : path.startsWith(t.href);
            return <Link key={t.href} href={t.href} className={on ? "on" : ""}>{t.label}</Link>;
          })}
        </nav>
        <div className="adm-panel-actions">{children}</div>
      </div>
    </>
  );
}
