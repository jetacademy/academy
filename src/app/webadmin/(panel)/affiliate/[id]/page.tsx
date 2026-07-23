import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";
import { getAffiliateBalance } from "@/lib/affiliate";
import { updateAffiliateRates, adminSetAffiliateCode } from "../../../affiliate-actions";

export const dynamic = "force-dynamic";

const CONVERSION_LABEL: Record<string, string> = {
  PENDING: "Masa Tahan",
  AVAILABLE: "Siap Ditarik",
  WITHDRAWN: "Sudah Ditarik",
  VOIDED: "Dibatalkan",
};
const CONVERSION_BADGE: Record<string, string> = {
  PENDING: "badge y",
  AVAILABLE: "badge g",
  WITHDRAWN: "badge dim",
  VOIDED: "badge r",
};

export default async function AdminAffiliateDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const { id } = await params;
  const { ok, e } = await searchParams;

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    include: {
      user: true,
      conversions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!affiliate) notFound();

  const balance = await getAffiliateBalance(affiliate.id);

  return (
    <>
      <div className="adm-head">
        <h1>Affiliate: {affiliate.user.name}</h1>
        <Link href="/webadmin/affiliate" className="btn btn-sm btn-line">← Kembali</Link>
      </div>

      {ok === "1" && <div className="adm-alert ok">Perubahan berhasil disimpan.</div>}
      {e === "persen" && <div className="adm-alert err">Nilai tipe Persen maksimal 100.</div>}
      {e === "kodedipakai" && <div className="adm-alert err">Kode sudah dipakai affiliate lain.</div>}
      {e === "kodependek" && <div className="adm-alert err">Kode minimal 3 karakter.</div>}

      <div className="adm-split">
        <div style={{ display: "grid", gap: "1.2rem" }}>
          {/* Ringkasan saldo */}
          <div className="tbl-wrap" style={{ padding: "1.2rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.8rem" }}>Ringkasan Komisi</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))", gap: "0.8rem" }}>
              <div>
                <div className="muted" style={{ fontSize: "0.75rem" }}>Siap Ditarik</div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{rupiah(balance.withdrawableNow)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: "0.75rem" }}>Masa Tahan</div>
                <div style={{ fontWeight: 700 }}>{rupiah(balance.pendingTotal)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: "0.75rem" }}>Sudah Dicairkan</div>
                <div style={{ fontWeight: 700 }}>{rupiah(balance.totalWithdrawn)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: "0.75rem" }}>Total Klik Link</div>
                <div style={{ fontWeight: 700 }}>{affiliate.clickCount}</div>
              </div>
            </div>
          </div>

          {/* Histori konversi */}
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nilai Transaksi</th>
                  <th>Komisi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {affiliate.conversions.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Tanggal" className="muted" style={{ fontSize: "0.78rem" }}>
                      {new Date(c.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td data-label="Nilai Transaksi">{rupiah(c.saleAmount)}</td>
                    <td data-label="Komisi" style={{ fontWeight: 700 }}>{rupiah(c.commissionAmount)}</td>
                    <td data-label="Status"><span className={CONVERSION_BADGE[c.status]}>{CONVERSION_LABEL[c.status]}</span></td>
                  </tr>
                ))}
                {affiliate.conversions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted" style={{ textAlign: "center", padding: "1.5rem" }}>
                      Belum ada transaksi lewat affiliate ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "grid", gap: "1.2rem" }}>
          <form action={updateAffiliateRates} className="adm-form" style={{ gridTemplateColumns: "1fr", padding: "1.4rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Rate Komisi &amp; Diskon</h3>
            <input type="hidden" name="id" value={affiliate.id} />

            <div className="field">
              <label>Tipe Komisi Affiliate</label>
              <select name="commissionType" defaultValue={affiliate.commissionType}>
                <option value="PERCENT">Persen (%) dari transaksi</option>
                <option value="FIXED">Nominal Tetap (Rp) per transaksi</option>
              </select>
            </div>
            <div className="field">
              <label>Nilai Komisi</label>
              <input name="commissionValue" type="number" min={0} defaultValue={affiliate.commissionValue} required />
            </div>

            <div className="field">
              <label>Tipe Diskon Customer</label>
              <select name="discountType" defaultValue={affiliate.discountType}>
                <option value="PERCENT">Persen (%) dari harga</option>
                <option value="FIXED">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div className="field">
              <label>Nilai Diskon Customer (0 = tanpa diskon)</label>
              <input name="discountValue" type="number" min={0} defaultValue={affiliate.discountValue} required />
              <span className="adm-note">Potongan harga yang didapat pembeli yang memakai kode/link affiliate ini.</span>
            </div>

            <div className="field">
              <label>Catatan Admin (opsional, tidak terlihat affiliate)</label>
              <textarea name="adminNote" rows={2} defaultValue={affiliate.adminNote ?? ""} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-purple btn-sm">Simpan Rate</button>
            </div>
          </form>

          <form action={adminSetAffiliateCode} className="adm-form" style={{ gridTemplateColumns: "1fr", padding: "1.4rem" }}>
            <h3 style={{ marginBottom: "0.6rem" }}>Kode Referral</h3>
            <input type="hidden" name="id" value={affiliate.id} />
            <div className="field">
              <label>Kode custom (huruf/angka/tanda hubung)</label>
              <input name="code" defaultValue={affiliate.code} style={{ textTransform: "uppercase", fontFamily: "monospace" }} required />
            </div>
            <p className="adm-note">
              URL referral: <code>{`${process.env.NEXT_PUBLIC_BASE_URL ?? "https://academy.jetschool.id"}/?ref=${affiliate.code}`}</code>
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-sm">Ganti Kode</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
