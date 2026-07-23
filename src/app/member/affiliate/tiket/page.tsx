import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/member-auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TicketCreateForm from "@/components/TicketCreateForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  CLOSED: "Ditutup",
};

export default async function MemberTicketListPage() {
  const sessionVal = await getMemberSession();
  if (!sessionVal) redirect("/member/login");

  const tickets = await prisma.ticket.findMany({
    where: { email: sessionVal },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <Navbar minimal ctaHref="/member/affiliate" ctaLabel="Dashboard Affiliate" />
      <section className="section" style={{ minHeight: "80vh", background: "var(--bg-panel)", paddingTop: "2.5rem" }}>
        <div className="container" style={{ display: "grid", gap: "2rem", maxWidth: "50rem", margin: "0 auto" }}>
          <div>
            <span className="kicker">Dukungan</span>
            <h1 style={{ fontSize: "1.6rem", margin: "0.3rem 0" }}>Tiket Saya</h1>
            <p className="sub">Ajukan pertanyaan seputar komisi, penarikan, akun, atau kendala teknis lainnya.</p>
          </div>

          {tickets.length > 0 && (
            <div className="member-program-card reveal in" style={{ display: "block", padding: 0 }}>
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/member/affiliate/tiket/${t.id}`}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "1rem 1.2rem", borderBottom: "1px solid var(--line)", color: "inherit", textDecoration: "none",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.subject}</div>
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      {new Date(t.updatedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <span className="badge">{STATUS_LABEL[t.status]}</span>
                </Link>
              ))}
            </div>
          )}

          <TicketCreateForm />
        </div>
      </section>
      <Footer />
    </>
  );
}
