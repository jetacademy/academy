import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";
import { TYPE_LABEL, type ProgramType } from "@/lib/fallback";

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  REGISTERED: { cls: "dim", label: "Terdaftar" },
  PAID: { cls: "y", label: "Lunas" },
  PASSED: { cls: "g", label: "Lulus" },
};

export default async function AdminDashboard() {
  const [regCount, revenue, certCount, programs, latest] = await Promise.all([
    prisma.registration.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.certificate.count(),
    prisma.program.findMany({
      orderBy: { scheduleAt: "asc" },
      include: { _count: { select: { registrations: true } } },
    }),
    prisma.registration.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { program: true, payment: true },
    }),
  ]);

  // rekap per program: pendaftar, lunas, pendapatan
  const perProgram = await Promise.all(
    programs.map(async (p) => {
      const [paid, income] = await Promise.all([
        prisma.registration.count({ where: { programId: p.id, status: { in: ["PAID", "PASSED"] } } }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "PAID", registration: { programId: p.id } },
        }),
      ]);
      return { ...p, paid, income: income._sum.amount ?? 0 };
    })
  );

  return (
    <>
      <div className="adm-head">
        <h1>Dashboard</h1>
        <Link href="/webadmin/program/new" className="btn btn-yellow btn-sm">+ Program Baru</Link>
      </div>

      <div className="adm-stats">
        <div className="adm-stat"><b>{regCount}</b><span>Total Pendaftar</span></div>
        <div className="adm-stat"><b>{rupiah(revenue._sum.amount ?? 0)}</b><span>Pendapatan Lunas</span></div>
        <div className="adm-stat"><b>{certCount}</b><span>Sertifikat Terbit</span></div>
        <div className="adm-stat"><b>{programs.filter((p) => p.isActive).length}</b><span>Program Aktif</span></div>
      </div>

      <div className="adm-head" style={{ marginTop: "2.4rem" }}>
        <h2 style={{ fontSize: "1.25rem" }}>Rekap per Program</h2>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Program</th><th>Tipe</th><th>Pendaftar</th><th>Lunas</th><th>Pendapatan</th><th>Status</th></tr>
          </thead>
          <tbody>
            {perProgram.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/webadmin/program/${p.id}`} style={{ fontWeight: 600 }}>{p.title}</Link></td>
                <td><span className={`badge${p.price === 0 ? " y" : ""}`}>{TYPE_LABEL[p.type as ProgramType]}</span></td>
                <td>{p._count.registrations}</td>
                <td>{p.paid}</td>
                <td>{rupiah(p.income)}</td>
                <td>{p.isActive ? <span className="badge g">Aktif</span> : <span className="badge dim">Nonaktif</span>}</td>
              </tr>
            ))}
            {perProgram.length === 0 && (
              <tr><td colSpan={6} className="muted">Belum ada program. Jalankan `npm run db:seed` atau buat baru.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="adm-head" style={{ marginTop: "2.4rem" }}>
        <h2 style={{ fontSize: "1.25rem" }}>Pendaftar Terbaru</h2>
        <Link href="/webadmin/pendaftar" className="btn btn-sm">Lihat Semua →</Link>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Nama</th><th>WhatsApp</th><th>Program</th><th>Status</th><th>Waktu</th></tr>
          </thead>
          <tbody>
            {latest.map((r) => {
              const b = STATUS_BADGE[r.status];
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.whatsapp}</td>
                  <td className="muted">{r.program.title}</td>
                  <td><span className={`badge ${b.cls}`}>{b.label}</span></td>
                  <td className="muted">{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(r.createdAt)}</td>
                </tr>
              );
            })}
            {latest.length === 0 && <tr><td colSpan={5} className="muted">Belum ada pendaftar.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
