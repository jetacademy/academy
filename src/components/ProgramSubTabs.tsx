"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { suffix: "", label: "Info Program" },
  { suffix: "/lms", label: "Kurikulum" },
  { suffix: "/kelulusan", label: "Kelulusan" },
  { suffix: "/cert", label: "Desain Sertifikat" },
];

export default function ProgramSubTabs({ programId }: { programId: string }) {
  const path = usePathname();
  const base = `/webadmin/program/${programId}`;
  return (
    <nav className="prog-tabs">
      {TABS.map((t) => {
        const href = `${base}${t.suffix}`;
        const on = t.suffix === "" ? path === base : path.startsWith(href);
        return (
          <Link key={href} href={href} className={on ? "on" : ""}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
