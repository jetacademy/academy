import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberSession } from "@/lib/member-auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TicketReplyForm from "@/components/TicketReplyForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  CLOSED: "Ditutup",
};

export default async function MemberTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const sessionVal = await getMemberSession();
  if (!sessionVal) redirect("/member/login");

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket || ticket.email !== sessionVal) notFound();

  return (
    <>
      <Navbar minimal ctaHref="/member/affiliate" ctaLabel="Dashboard Affiliate" />
      <section className="section" style={{ minHeight: "80vh", background: "var(--bg-panel)", paddingTop: "2.5rem" }}>
        <div className="container" style={{ maxWidth: "44rem", margin: "0 auto" }}>
          <span className="kicker">Tiket Dukungan</span>
          <h1 style={{ fontSize: "1.5rem", margin: "0.3rem 0 1.2rem" }}>{ticket.subject}</h1>
          <span className="badge" style={{ marginBottom: "1.2rem", display: "inline-block" }}>{STATUS_LABEL[ticket.status]}</span>

          <div style={{ display: "grid", gap: "0.8rem", marginBottom: "1.4rem" }}>
            {ticket.messages.map((m) => (
              <div
                key={m.id}
                style={{
                  maxWidth: "80%",
                  marginLeft: m.senderRole === "USER" ? "auto" : 0,
                  background: m.senderRole === "USER" ? "var(--purple)" : "var(--white)",
                  color: m.senderRole === "USER" ? "#fff" : "var(--ink)",
                  border: m.senderRole === "USER" ? "none" : "1px solid var(--line)",
                  borderRadius: "10px",
                  padding: "0.7rem 0.9rem",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div style={{ fontSize: "0.72rem", opacity: 0.75, marginBottom: "0.2rem" }}>
                  {m.senderRole === "ADMIN" ? "Tim Jetschool Academy" : "Anda"} · {new Date(m.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{m.message}</div>
              </div>
            ))}
          </div>

          {ticket.status !== "CLOSED" && <TicketReplyForm ticketId={ticket.id} />}
        </div>
      </section>
      <Footer />
    </>
  );
}
