import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";
import { markPaid, deleteRegistration } from "../../actions";

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  REGISTERED: { cls: "dim", label: "Terdaftar" },
  PAID: { cls: "y", label: "Lunas" },
  PASSED: { cls: "g", label: "Lulus" },
};

export default async function AdminPendaftar({ searchParams }: {
  searchParams: Promise<{ q?: string; program?: string; status?: string; page?: string }>;
}) {
  const { q, program, status, page } = await searchParams;

  const currentPage = Number(page ?? "1") || 1;
  const limit = 50;
  const skip = (currentPage - 1) * limit;

  const where = {
    ...(q ? { OR: [{ name: { contains: q } }, { whatsapp: { contains: q } }, { email: { contains: q } }] } : {}),
    ...(program ? { programId: program } : {}),
    ...(status ? { status: status as "REGISTERED" | "PAID" | "PASSED" } : {}),
  };

  const [programs, regs, totalCount] = await Promise.all([
    prisma.program.findMany({ orderBy: { title: "asc" }, take: 200, select: { id: true, title: true } }),
    prisma.registration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { program: true, payment: true, certificate: true },
    }),
    prisma.registration.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="adm-head">
        <h1>Pendaftar <span style={{ color: "var(--ink-faint)", fontSize: "1rem" }}>({totalCount} total)</span></h1>
        <Link href="/webadmin/pendaftar/new" className="btn btn-yellow btn-sm">+ Pendaftar Baru</Link>
      </div>

      {/* filter */}
      <form method="get" style={{ display: "flex", gap: ".8rem", flexWrap: "wrap", marginBottom: "1.4rem" }}>
        <input name="q" defaultValue={q} placeholder="Cari nama / WA / email..."
          style={{ padding: ".6em 1em", border: "1px solid var(--line-strong)", borderRadius: "var(--r)", background: "var(--white)", minWidth: "16rem" }} />
        <select name="program" defaultValue={program ?? ""}
          style={{ padding: ".6em 1em", border: "1px solid var(--line-strong)", borderRadius: "var(--r)", background: "var(--white)" }}>
          <option value="">Semua Program</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""}
          style={{ padding: ".6em 1em", border: "1px solid var(--line-strong)", borderRadius: "var(--r)", background: "var(--white)" }}>
          <option value="">Semua Status</option>
          <option value="REGISTERED">Terdaftar</option>
          <option value="PAID">Lunas</option>
          <option value="PASSED">Lulus</option>
        </select>
        <button type="submit" className="btn btn-sm">Filter</button>
      </form>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Nama</th><th>Kontak</th><th>Program</th><th>Status</th><th>Pembayaran</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {regs.map((r) => {
              const b = STATUS_BADGE[r.status];
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.name}
                    {r.institution && <div style={{ fontSize: "0.75rem", color: "var(--purple)", fontWeight: "normal" }}>Lembaga: {r.institution}</div>}
                    <div className="muted">{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(r.createdAt)}</div>
                  </td>
                  <td>{r.whatsapp}<div className="muted">{r.email}</div></td>
                  <td className="muted">{r.program.title}</td>
                  <td><span className={`badge ${b.cls}`}>{b.label}</span></td>
                  <td>
                    {r.payment
                      ? <>{rupiah(r.payment.amount)}<div className="muted">{r.payment.status}</div></>
                      : <span className="muted">—</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                      <Link href={`/webadmin/pendaftar/${r.id}`} className="btn btn-sm">Edit</Link>
                      {["REGISTERED", "EXPIRED", "FAILED"].includes(r.status) && (
                        <form action={markPaid}>
                          <input type="hidden" name="id" value={r.id} />
                          <button type="submit" className="btn btn-sm btn-yellow" title="Tandai lunas manual (transfer langsung) + kirim WA akses">
                            Tandai Lunas
                          </button>
                        </form>
                      )}
                      {r.certificate && (
                        <a href={`/sertifikat/${r.certificate.number}`} target="_blank" className="btn btn-sm">Sertifikat ↗</a>
                      )}
                      <form action={deleteRegistration}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="btn btn-sm btn-danger">Hapus</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {regs.length === 0 && <tr><td colSpan={6} className="muted">Tidak ada pendaftar yang cocok.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: ".8rem", alignItems: "center", marginTop: "1.4rem", justifyContent: "center" }}>
          {currentPage > 1 && (
            <Link
              href={`/webadmin/pendaftar?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(program ? { program } : {}),
                ...(status ? { status } : {}),
                page: String(currentPage - 1),
              }).toString()}`}
              className="btn btn-sm"
            >
              ← Sebelum
            </Link>
          )}
          <span style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--ink-soft)" }}>
            Halaman {currentPage} dari {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/webadmin/pendaftar?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(program ? { program } : {}),
                ...(status ? { status } : {}),
                page: String(currentPage + 1),
              }).toString()}`}
              className="btn btn-sm"
            >
              Sesudah →
            </Link>
          )}
        </div>
      )}

      <p className="adm-note" style={{ marginTop: ".8rem" }}>
        <b>Tandai Lunas</b> dipakai jika peserta membayar di luar Xendit (transfer manual) — status berubah, WA akses terkirim otomatis.
      </p>
    </>
  );
}
