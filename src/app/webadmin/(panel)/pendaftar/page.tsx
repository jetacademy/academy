import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";
import { markPaid, deleteRegistration } from "../../actions";
import ConfirmButton from "@/components/ConfirmButton";
import RefundButton from "@/components/RefundButton";

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  REGISTERED: { cls: "dim", label: "Terdaftar" },
  PAID: { cls: "y", label: "Lunas" },
  PASSED: { cls: "g", label: "Lulus" },
  FAILED: { cls: "dim", label: "Gagal" },
  EXPIRED: { cls: "dim", label: "Kadaluwarsa" },
  CANCELLED: { cls: "dim", label: "Dibatalkan" },
  REFUNDED: { cls: "dim", label: "Direfund" },
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
    ...(status ? { status: status as "REGISTERED" | "PAID" | "PASSED" | "EXPIRED" | "FAILED" | "CANCELLED" | "REFUNDED" } : {}),
  };

  const [programs, regs, totalCount, paidCount] = await Promise.all([
    getPrograms(),
    prisma.registration.findMany({
      where,
      include: { program: true, payment: true, testAttempts: true },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.registration.count({ where }),
    prisma.registration.count({ where: { ...where, status: "PAID" } }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="adm-head">
        <h1>Pendaftar <span style={{ color: "var(--ink-faint)", fontSize: "1rem" }}>({paidCount} lunas dari {totalCount} total)</span></h1>
        <Link href="/webadmin/pendaftar/new" className="btn btn-yellow btn-sm">+ Pendaftar Baru</Link>
      </div>

      {/* filter */}
      <form method="get" className="adm-filter-row">
        <input name="q" defaultValue={q} placeholder="Cari nama / WA / email..." style={{ flexBasis: "16rem" }} />
        <select name="program" defaultValue={program ?? ""}>
          <option value="">Semua Program</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""}>
          <option value="">Semua Status</option>
          <option value="REGISTERED">Terdaftar</option>
          <option value="PAID">Lunas</option>
          <option value="PASSED">Lulus</option>
          <option value="EXPIRED">Kadaluwarsa</option>
          <option value="FAILED">Gagal</option>
          <option value="CANCELLED">Dibatalkan</option>
          <option value="REFUNDED">Direfund</option>
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
              const b = STATUS_BADGE[r.status] ?? { cls: "dim", label: r.status };
              return (
                <tr key={r.id}>
                  <td data-label="Nama" style={{ fontWeight: 600 }}>{r.name}
                    {r.institution && <div style={{ fontSize: "0.75rem", color: "var(--purple)", fontWeight: "normal" }}>Lembaga: {r.institution}</div>}
                    <div className="muted">{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(r.createdAt)}</div>
                  </td>
                  <td data-label="Kontak">{r.whatsapp}<div className="muted">{r.email}</div></td>
                  <td data-label="Program" className="muted">{r.program.title}</td>
                  <td data-label="Status"><span className={`badge ${b.cls}`}>{b.label}</span></td>
                  <td data-label="Pembayaran">
                    {r.payment
                      ? <>
                          {r.payment.discountAmount > 0 && r.payment.originalAmount ? (
                            <>
                              <span style={{ textDecoration: "line-through", color: "var(--ink-faint)", fontSize: "0.8rem" }}>{rupiah(r.payment.originalAmount)}</span>
                              {" "}{rupiah(r.payment.amount)}
                              <div className="muted">
                                Diskon {rupiah(r.payment.discountAmount)}{r.payment.voucher ? ` (${r.payment.voucher.code})` : ""}
                              </div>
                            </>
                          ) : (
                            rupiah(r.payment.amount)
                          )}
                          {r.payment.status === "REFUNDED" ? (
                            <div className="muted" title={r.payment.refundReason ?? ""}>
                              Direfund {r.payment.refundAmount ? rupiah(r.payment.refundAmount) : ""}
                              {r.payment.refundedAt ? ` · ${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(r.payment.refundedAt)}` : ""}
                            </div>
                          ) : (
                            <div className="muted">{r.payment.status}</div>
                          )}
                        </>
                      : <span className="muted">—</span>}
                  </td>
                  <td data-label="Aksi">
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
                      {["PAID", "PASSED"].includes(r.status) && r.payment?.status === "PAID" && (
                        <RefundButton
                          registrationId={r.id}
                          defaultAmount={r.payment.amount}
                          className="btn btn-sm btn-danger"
                          title="Catat refund manual + cabut akses peserta"
                        />
                      )}
                      {r.certificate && (
                        <a href={`/sertifikat/${r.certificate.number}`} target="_blank" className="btn btn-sm">Sertifikat ↗</a>
                      )}
                      <form action={deleteRegistration}>
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmButton className="btn btn-sm btn-danger" message={`Apakah Anda yakin ingin menghapus pendaftaran atas nama "${r.name}"? Semua histori pembayaran dan sertifikat terkait akan ikut terhapus.`}>
                          Hapus
                        </ConfirmButton>
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
        <br />
        Klaim sertifikat program Webinar baru aktif otomatis 1×24 jam setelah jadwal sesi berakhir — tidak perlu tindakan manual di sini.
      </p>
    </>
  );
}
