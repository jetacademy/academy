import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { replyTicket } from "../../../../affiliate-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  CLOSED: "Ditutup",
};

export default async function AdminTicketDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const { id } = await params;
  const { ok, e } = await searchParams;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      affiliate: { include: { user: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  return (
    <>
      <div className="adm-head">
        <h1>Tiket: {ticket.subject}</h1>
        <Link href="/webadmin/affiliate/tiket" className="btn btn-sm btn-line">← Kembali</Link>
      </div>

      {ok === "1" && <div className="adm-alert ok">Balasan terkirim.</div>}
      {e === "lengkapi" && <div className="adm-alert err">Isi pesan balasan wajib diisi.</div>}

      <div className="tbl-wrap" style={{ padding: "1.2rem", marginBottom: "1.2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: "0.6rem", fontSize: "0.85rem" }}>
          <div><span className="muted">Nama:</span> <strong>{ticket.name}</strong></div>
          <div><span className="muted">Email:</span> {ticket.email}</div>
          <div><span className="muted">WhatsApp:</span> {ticket.whatsapp ?? "—"}</div>
          <div><span className="muted">Affiliate:</span> {ticket.affiliate ? `${ticket.affiliate.user.name} (${ticket.affiliate.code})` : "— (bukan affiliate)"}</div>
          <div><span className="muted">Status saat ini:</span> {STATUS_LABEL[ticket.status]}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.8rem", marginBottom: "1.4rem" }}>
        {ticket.messages.map((m) => (
          <div
            key={m.id}
            style={{
              maxWidth: "70%",
              marginLeft: m.senderRole === "ADMIN" ? "auto" : 0,
              background: m.senderRole === "ADMIN" ? "var(--purple)" : "var(--bg-card)",
              color: m.senderRole === "ADMIN" ? "#fff" : "var(--ink)",
              border: m.senderRole === "ADMIN" ? "none" : "1px solid var(--line)",
              borderRadius: "10px",
              padding: "0.7rem 0.9rem",
            }}
          >
            <div style={{ fontSize: "0.72rem", opacity: 0.75, marginBottom: "0.2rem" }}>
              {m.senderName} · {new Date(m.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{m.message}</div>
          </div>
        ))}
        {ticket.messages.length === 0 && <p className="muted">Belum ada pesan.</p>}
      </div>

      <form action={replyTicket} className="adm-form" style={{ gridTemplateColumns: "1fr", maxWidth: "40rem" }}>
        <input type="hidden" name="ticketId" value={ticket.id} />
        <div className="field">
          <label>Balasan</label>
          <textarea name="message" rows={4} required placeholder="Tulis balasan untuk tiket ini..." />
        </div>
        <div className="field">
          <label>Ubah Status Menjadi</label>
          <select name="status" defaultValue={ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status}>
            <option value="IN_PROGRESS">Diproses</option>
            <option value="RESOLVED">Selesai</option>
            <option value="CLOSED">Ditutup</option>
            <option value="OPEN">Baru (buka lagi)</option>
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-purple btn-sm">Kirim Balasan</button>
        </div>
      </form>
    </>
  );
}
