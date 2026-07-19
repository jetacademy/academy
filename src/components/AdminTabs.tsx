"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface MenuItem {
  href: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

interface MenuGroup {
  label: string;
  href?: string;
  icon: React.ReactNode;
  items?: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    label: "Dashboard",
    href: "/webadmin",
    icon: (
      <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    )
  },
  {
    label: "Program & Konten",
    icon: (
      <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    items: [
      {
        href: "/webadmin/program",
        label: "Program",
        desc: "Kelola kelas, webinar, workshop & bootcamp",
        icon: (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      },
      {
        href: "/webadmin/kategori",
        label: "Kategori",
        desc: "Kelola kategori & tag program belajar",
        icon: (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      },
      {
        href: "/webadmin/artikel",
        label: "Artikel",
        desc: "Tulis & terbitkan materi edukasi blog",
        icon: (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        )
      },
    ]
  },
  {
    label: "Data & Operasional",
    icon: (
      <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    items: [
      {
        href: "/webadmin/pendaftar",
        label: "Pendaftar",
        desc: "Pantau pendaftaran & pembayaran peserta",
        icon: (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      },
      {
        href: "/webadmin/sertifikat",
        label: "Sertifikat",
        desc: "Kelola data kelulusan & klaim sertifikat",
        icon: (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        )
      },
    ]
  },
  {
    label: "Sistem",
    icon: (
      <svg className="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    items: [
      {
        href: "/webadmin/user",
        label: "User",
        desc: "Manajemen hak akses admin, pengajar & siswa",
        icon: (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      },
      {
        href: "/webadmin/integrasi",
        label: "Integrasi API",
        desc: "Konfigurasi Whatsapp, Xendit & Bunny.net",
        icon: (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a2 2 0 11-4 0V4zM18 14a2 2 0 110-4h1a2 2 0 110 4h-1zM6 14a2 2 0 110-4H5a2 2 0 110 4h1zM11 18a2 2 0 114 0v1a2 2 0 11-4 0v-1z" />
          </svg>
        )
      },
    ]
  }
];

export default function AdminTabs({ children }: { children?: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null);

  const [prevPath, setPrevPath] = useState(path);
  if (path !== prevPath) {
    setOpen(false);
    setMobileOpenGroup(null);
    setPrevPath(path);
  }

  const isGroupActive = (g: MenuGroup) => {
    if (g.href) {
      return path === g.href;
    }
    if (g.items) {
      return g.items.some((item) => path.startsWith(item.href));
    }
    return false;
  };

  const handleTriggerClick = (e: React.MouseEvent, g: MenuGroup) => {
    if (g.items && window.innerWidth <= 860) {
      e.preventDefault();
      e.stopPropagation();
      setMobileOpenGroup((prev) => (prev === g.label ? null : g.label));
    }
  };

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
      <div 
        className={`adm-nav-panel${open ? " open" : ""}`} 
        onClick={() => setOpen(false)}
      >
        <nav className="adm-tabs" onClick={(e) => e.stopPropagation()}>
          {MENU_GROUPS.map((g) => {
            const on = isGroupActive(g);
            const isMobileAccordionOpen = mobileOpenGroup === g.label;

            if (g.href) {
              return (
                <Link 
                  key={g.href} 
                  href={g.href} 
                  className={on ? "on" : ""}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {g.icon}
                  {g.label}
                </Link>
              );
            }

            return (
              <div 
                key={g.label} 
                className={`adm-nav-group${isMobileAccordionOpen ? " open-mobile" : ""}${on ? " active" : ""}`}
              >
                <button
                  type="button"
                  className={`adm-nav-trigger ${on ? "on" : ""}`}
                  onClick={(e) => handleTriggerClick(e, g)}
                >
                  {g.icon}
                  {g.label}
                  <svg className="chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} style={{ width: "0.75rem", height: "0.75rem" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="adm-nav-dropdown">
                  {g.items?.map((item) => {
                    const itemOn = path.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`adm-nav-item ${itemOn ? "on" : ""}`}
                        onClick={() => setOpen(false)}
                      >
                        {item.icon}
                        <div className="adm-nav-item-content">
                          <span className="adm-nav-item-title">{item.label}</span>
                          <span className="adm-nav-item-desc">{item.desc}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="adm-panel-actions" onClick={(e) => e.stopPropagation()}>{children}</div>
      </div>
    </>
  );
}
