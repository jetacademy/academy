import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { adminLogout } from "../actions";
import AdminTabs from "@/components/AdminTabs";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata = { title: "Panel Admin — Jetschool Academy" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // semua halaman panel butuh login

  return (
    <>
      <header className="adm-top">
        <div className="container adm-top-inner">
          <Link href="/webadmin" className="brand" style={{ fontSize: "1.2rem" }}>
            <Image
              src="/iconjetschool academy.png"
              alt="Jetschool Academy"
              width={32}
              height={32}
              style={{ objectFit: "contain" }}
            />
            Jetschool <small style={{ color: "var(--ink-faint)", fontSize: ".7rem", fontWeight: 800 }}>ADMIN</small>
          </Link>
          <AdminTabs />
          <div style={{ display: "flex", gap: ".7rem", alignItems: "center" }}>
            <a href="/" target="_blank" className="btn btn-sm">Lihat Website ↗</a>
            <form action={adminLogout}>
              <button type="submit" className="btn btn-sm btn-danger">Keluar</button>
            </form>
          </div>
        </div>
      </header>
      <main className="container adm-main">{children}</main>
    </>
  );
}
