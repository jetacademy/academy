import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { adminLogin } from "../actions";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Login Admin — Jetschool Academy" };

export default async function AdminLoginPage({ searchParams }: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await isAdmin()) redirect("/webadmin");
  const { e } = await searchParams;

  return (
    <section className="section" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ width: "min(26rem, 92%)" }}>
        <form className="reg-card" action={adminLogin}>
          <div className="brand" style={{ justifyContent: "center", marginBottom: "1.2rem" }}>
            <Image
              src="/iconjetschool academy.png"
              alt="Jetschool Academy"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
            />
            Jetschool <small style={{ color: "var(--ink-faint)", fontSize: ".7rem", fontWeight: 800 }}>ADMIN</small>
          </div>
          <h3 style={{ textAlign: "center" }}>Panel Admin</h3>
          <p className="sub" style={{ textAlign: "center" }}>Masuk untuk mengelola program, pendaftar & sertifikat.</p>

          {e && <div className="form-error">Password salah. Coba lagi.</div>}

          <div className="field">
            <label htmlFor="pw">Password Admin</label>
            <input id="pw" name="password" type="password" placeholder="••••••••" required autoFocus />
          </div>
          <button type="submit" className="btn btn-ink btn-lg btn-block">Masuk dengan Password</button>

          <div style={{ margin: "1.2rem 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ height: "1px", background: "var(--line)", flexGrow: 1 }} />
            <span style={{ fontSize: ".74rem", color: "var(--ink-faint)", padding: "0 .8rem", fontWeight: 700 }}>ATAU</span>
            <span style={{ height: "1px", background: "var(--line)", flexGrow: 1 }} />
          </div>

          <Link href="/member/login" className="btn btn-purple btn-lg btn-block" style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            Masuk dengan Google (Superadmin)
          </Link>

          <p className="reg-note" style={{ textAlign: "center", marginTop: "1.5rem" }}>
            Password diatur lewat <b>ADMIN_PASSWORD</b> di file .env
          </p>
        </form>
      </div>
    </section>
  );
}
