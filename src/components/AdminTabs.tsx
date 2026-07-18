"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/webadmin", label: "Dashboard" },
  { href: "/webadmin/program", label: "Program" },
  { href: "/webadmin/kategori", label: "Kategori" },
  { href: "/webadmin/pendaftar", label: "Pendaftar" },
  { href: "/webadmin/sertifikat", label: "Sertifikat" },
];

export default function AdminTabs() {
  const path = usePathname();
  return (
    <nav className="adm-tabs">
      {TABS.map((t) => {
        const on = t.href === "/webadmin" ? path === "/webadmin" : path.startsWith(t.href);
        return <Link key={t.href} href={t.href} className={on ? "on" : ""}>{t.label}</Link>;
      })}
    </nav>
  );
}
