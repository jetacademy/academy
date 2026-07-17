import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { adminLogin } from "../actions";

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
            <span className="brand-mark">✦</span> Jetschool <small style={{ color: "var(--ink-faint)", fontSize: ".7rem", fontWeight: 800 }}>ADMIN</small>
          </div>
          <h3 style={{ textAlign: "center" }}>Panel Admin</h3>
          <p className="sub" style={{ textAlign: "center" }}>Masuk untuk mengelola program, pendaftar & sertifikat.</p>

          {e && <div className="form-error">Password salah. Coba lagi.</div>}

          <div className="field">
            <label htmlFor="pw">Password Admin</label>
            <input id="pw" name="password" type="password" placeholder="••••••••" required autoFocus />
          </div>
          <button type="submit" className="btn btn-ink btn-lg btn-block">Masuk</button>
          <p className="reg-note" style={{ textAlign: "center" }}>
            Password diatur lewat <b>ADMIN_PASSWORD</b> di file .env
          </p>
        </form>
      </div>
    </section>
  );
}
