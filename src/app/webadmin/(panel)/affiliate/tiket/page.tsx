import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  OPEN: "badge y",
  IN_PROGRESS: "badge y",
  RESOLVED: "badge g",
  CLOSED: "badge dim",
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  CLOSED: "Ditutup",
};
const CATEGORY_LABEL: Record<string, string> = {
  KOMISI: "Komisi",
  PENARIKAN: "Penarikan",
  AKUN: "Akun",
  TEKNIS: "Teknis",
  LAINNYA: "Lainnya",
};

export default async function AdminTicketList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const where = status && ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status) ? { status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" } : {};

  const tickets = await prisma.ticket.findMany({
    where,
    include: { affiliate: { include: { user: true } }, _count: { select: { messages: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <>
      <div className="adm-head">
        <h1>Tiket Dukungan</h1>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/webadmin/affiliate/tiket" className={`btn btn-sm ${!status ? "btn-purple" : ""}`}>Semua</Link>
          <Link href="/webadmin/affiliate/tiket?status=OPEN" className={`btn btn-sm ${status === "OPEN" ? "btn-purple" : ""}`}>Baru</Link>
          <Link href="/webadmin/affiliate/tiket?status=IN_PROGRESS" className={`btn btn-sm ${status === "IN_PROGRESS" ? "btn-purple" : ""}`}>Diproses</Link>
          <Link href="/webadmin/affiliate/tiket?status=RESOLVED" className={`btn btn-sm ${status === "RESOLVED" ? "btn-purple" : ""}`}>Selesai</Link>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Pengirim</th>
              <th>Subjek</th>
              <th>Kategori</th>
              <th>Balasan</th>
              <th>Update Terakhir</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td data-label="Pengirim">
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: "0.78rem" }}>
                    {t.email} {t.affiliate ? `· Affiliate (${t.affiliate.code})` : ""}
                  </div>
                </td>
                <td data-label="Subjek">{t.subject}</td>
                <td data-label="Kategori" className="muted">{CATEGORY_LABEL[t.category]}</td>
                <td data-label="Balasan">{t._count.messages}</td>
                <td data-label="Update Terakhir" className="muted" style={{ fontSize: "0.78rem" }}>
                  {new Date(t.updatedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td data-label="Status"><span className={STATUS_BADGE[t.status]}>{STATUS_LABEL[t.status]}</span></td>
                <td data-label="Aksi">
                  <Link href={`/webadmin/affiliate/tiket/${t.id}`} className="btn btn-sm">Buka</Link>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: "center", padding: "1.5rem" }}>
                  Belum ada tiket.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
