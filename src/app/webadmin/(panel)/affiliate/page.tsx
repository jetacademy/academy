import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";
import { inviteAffiliate, toggleAffiliateSuspend } from "../../affiliate-actions";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge y",
  ACTIVE: "badge g",
  SUSPENDED: "badge dim",
  REJECTED: "badge r",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Respons",
  ACTIVE: "Aktif",
  SUSPENDED: "Nonaktif Sementara",
  REJECTED: "Ditolak",
};

export default async function AdminAffiliateList({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const { ok, e } = await searchParams;

  const [affiliates, candidateUsers] = await Promise.all([
    prisma.affiliate.findMany({
      include: { user: true, _count: { select: { conversions: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", affiliate: null },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  // Untuk tiap affiliate, hitung total komisi AVAILABLE+WITHDRAWN (earned) sekali query agregat
  const earnedByAffiliate = await prisma.affiliateConversion.groupBy({
    by: ["affiliateId"],
    where: { status: { in: ["AVAILABLE", "WITHDRAWN", "PENDING"] } },
    _sum: { commissionAmount: true },
  });
  const earnedMap = new Map(earnedByAffiliate.map((r) => [r.affiliateId, r._sum.commissionAmount ?? 0]));

  return (
    <>
      <div className="adm-head">
        <h1>Program Affiliate</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/webadmin/affiliate/penarikan" className="btn btn-sm">Penarikan</Link>
          <Link href="/webadmin/affiliate/tiket" className="btn btn-sm">Tiket</Link>
          <Link href="/webadmin/affiliate/pengaturan" className="btn btn-sm">Pengaturan</Link>
        </div>
      </div>

      {ok === "diundang" && <div className="adm-alert ok">Undangan affiliate berhasil dikirim.</div>}
      {e === "usernotfound" && <div className="adm-alert err">User tidak ditemukan.</div>}
      {e === "sudahaktif" && <div className="adm-alert err">User ini sudah menjadi affiliate aktif.</div>}

      <div className="adm-split">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Affiliate</th>
                <th>Kode</th>
                <th>Komisi</th>
                <th>Diskon Customer</th>
                <th>Konversi</th>
                <th>Total Komisi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <tr key={a.id}>
                  <td data-label="Affiliate">
                    <div style={{ fontWeight: 700 }}>{a.user.name}</div>
                    <div className="muted" style={{ fontSize: "0.78rem" }}>{a.user.email}</div>
                  </td>
                  <td data-label="Kode" style={{ fontWeight: 700, fontFamily: "monospace" }}>{a.code}</td>
                  <td data-label="Komisi" className="muted">
                    {a.commissionType === "PERCENT" ? `${a.commissionValue}%` : rupiah(a.commissionValue)}
                  </td>
                  <td data-label="Diskon Customer" className="muted">
                    {a.discountValue === 0 ? "—" : a.discountType === "PERCENT" ? `${a.discountValue}%` : rupiah(a.discountValue)}
                  </td>
                  <td data-label="Konversi">{a._count.conversions}</td>
                  <td data-label="Total Komisi">{rupiah(earnedMap.get(a.id) ?? 0)}</td>
                  <td data-label="Status">
                    <span className={STATUS_BADGE[a.status]}>{STATUS_LABEL[a.status]}</span>
                  </td>
                  <td data-label="Aksi">
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                      <Link href={`/webadmin/affiliate/${a.id}`} className="btn btn-sm">Kelola</Link>
                      {["ACTIVE", "SUSPENDED"].includes(a.status) && (
                        <form action={toggleAffiliateSuspend}>
                          <input type="hidden" name="id" value={a.id} />
                          <button type="submit" className="btn btn-sm btn-line">
                            {a.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>
                      )}
                      {["REJECTED", "PENDING"].includes(a.status) && (
                        <form action={inviteAffiliate}>
                          <input type="hidden" name="userId" value={a.userId} />
                          <button type="submit" className="btn btn-sm">
                            {a.status === "PENDING" ? "Kirim Ulang" : "Undang Ulang"}
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {affiliates.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted" style={{ textAlign: "center", padding: "1.5rem" }}>
                    Belum ada affiliate. Undang alumni/peserta dari daftar di samping.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="adm-form" style={{ gridTemplateColumns: "1fr", padding: "1.4rem" }}>
            <h3 style={{ marginBottom: "0.4rem" }}>Undang Jadi Affiliate</h3>
            <p className="adm-note" style={{ marginBottom: "1rem" }}>
              Hanya user terpilih yang Anda undang lewat tombol di bawah yang bisa jadi affiliate — tidak semua user otomatis dapat akses.
            </p>
            <div style={{ maxHeight: "22rem", overflowY: "auto", display: "grid", gap: "0.5rem" }}>
              {candidateUsers.map((u) => (
                <form
                  key={u.id}
                  action={inviteAffiliate}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem",
                    padding: "0.5rem 0.7rem", border: "1px solid var(--line)", borderRadius: "8px",
                  }}
                >
                  <input type="hidden" name="userId" value={u.id} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                    <div className="muted" style={{ fontSize: "0.72rem" }}>{u.email}</div>
                  </div>
                  <button type="submit" className="btn btn-sm btn-purple" style={{ flexShrink: 0 }}>
                    Undang
                  </button>
                </form>
              ))}
              {candidateUsers.length === 0 && (
                <p className="muted" style={{ fontSize: "0.85rem" }}>Semua user sudah pernah diundang atau tidak ada kandidat.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
