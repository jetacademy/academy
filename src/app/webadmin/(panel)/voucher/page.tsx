import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rupiah, toWIBInput } from "@/lib/format";
import { saveVoucher, deleteVoucher, toggleVoucher } from "../../actions";
import ConfirmButton from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function AdminVoucherList({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; e?: string; ok?: string; deleted?: string }>;
}) {
  const { id, e, ok, deleted } = await searchParams;

  const vouchers = await prisma.voucher.findMany({ orderBy: { createdAt: "desc" } });
  const editVoucher = id ? await prisma.voucher.findUnique({ where: { id } }) : null;

  return (
    <>
      <div className="adm-head">
        <h1>Voucher &amp; Diskon</h1>
      </div>

      {ok === "1" && <div className="adm-alert ok">Voucher berhasil disimpan.</div>}
      {deleted === "1" && <div className="adm-alert ok">Voucher berhasil dihapus.</div>}
      {e === "kode" && <div className="adm-alert err">Kode voucher sudah dipakai voucher lain. Gunakan kode yang berbeda.</div>}
      {e === "lengkapi" && <div className="adm-alert err">Kode dan nilai voucher wajib diisi (nilai harus lebih dari 0).</div>}
      {e === "persen" && <div className="adm-alert err">Nilai voucher tipe Persen maksimal 100.</div>}
      {e === "tanggal" && <div className="adm-alert err">Format tanggal masa berlaku tidak valid.</div>}

      <div className="adm-split">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Tipe &amp; Nilai</th>
                <th>Terpakai</th>
                <th>Masa Berlaku</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td data-label="Kode" style={{ fontWeight: 700 }}>{v.code}</td>
                  <td data-label="Tipe &amp; Nilai" className="muted">
                    {v.type === "PERCENT" ? `${v.value}%` : rupiah(v.value)}
                    {v.type === "PERCENT" && v.maxDiscount ? <div className="muted">maks. {rupiah(v.maxDiscount)}</div> : null}
                  </td>
                  <td data-label="Terpakai">{v.usedCount}{v.maxUses !== null ? ` / ${v.maxUses}` : ""}</td>
                  <td data-label="Masa Berlaku" className="muted">
                    {v.validFrom || v.validUntil ? (
                      <>
                        {v.validFrom ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(v.validFrom) : "—"}
                        {" s/d "}
                        {v.validUntil ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(v.validUntil) : "—"}
                      </>
                    ) : "Tanpa batas"}
                  </td>
                  <td data-label="Status">
                    <form action={toggleVoucher}>
                      <input type="hidden" name="id" value={v.id} />
                      <button type="submit" className={`badge ${v.isActive ? "g" : "dim"}`} style={{ border: "none", cursor: "pointer" }}>
                        {v.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </form>
                  </td>
                  <td data-label="Aksi">
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                      <Link href={`/webadmin/voucher?id=${v.id}`} className="btn btn-sm">Edit</Link>
                      <form action={deleteVoucher}>
                        <input type="hidden" name="id" value={v.id} />
                        <ConfirmButton className="btn btn-sm btn-danger" message={`Apakah Anda yakin ingin menghapus voucher "${v.code}"? Histori transaksi yang sudah memakai voucher ini tetap tersimpan.`}>
                          Hapus
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: "center", padding: "1.5rem" }}>
                    Belum ada voucher.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <form action={saveVoucher} className="adm-form" style={{ gridTemplateColumns: "1fr", padding: "1.4rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>
              {editVoucher ? "Edit Voucher" : "Tambah Voucher Baru"}
            </h3>

            {editVoucher && <input type="hidden" name="id" value={editVoucher.id} />}

            <div className="field">
              <label>Kode Voucher</label>
              <input
                name="code"
                defaultValue={editVoucher?.code ?? ""}
                placeholder="cth: DISKON20"
                style={{ textTransform: "uppercase" }}
                required
              />
              <span className="adm-note">Huruf besar, angka, dan tanda hubung saja.</span>
            </div>

            <div className="field">
              <label>Tipe Diskon</label>
              <select name="type" defaultValue={editVoucher?.type ?? "PERCENT"}>
                <option value="PERCENT">Persen (%)</option>
                <option value="FIXED">Nominal Tetap (Rp)</option>
              </select>
            </div>

            <div className="field">
              <label>Nilai Diskon</label>
              <input
                name="value"
                type="number"
                min={1}
                defaultValue={editVoucher?.value ?? ""}
                placeholder="cth: 20 (persen) atau 20000 (rupiah)"
                required
              />
            </div>

            <div className="field">
              <label>Maks. Potongan — khusus tipe Persen (opsional)</label>
              <input
                name="maxDiscount"
                type="number"
                min={0}
                defaultValue={editVoucher?.maxDiscount ?? ""}
                placeholder="cth: 50000"
              />
              <span className="adm-note">Kosongkan jika tidak ada batas maksimal potongan.</span>
            </div>

            <div className="field">
              <label>Kuota Pemakaian (opsional)</label>
              <input
                name="maxUses"
                type="number"
                min={0}
                defaultValue={editVoucher?.maxUses ?? ""}
                placeholder="Kosongkan = tak terbatas"
              />
            </div>

            <div className="field">
              <label>Berlaku Dari (opsional)</label>
              <input
                name="validFrom"
                type="datetime-local"
                defaultValue={editVoucher?.validFrom ? toWIBInput(editVoucher.validFrom) : ""}
              />
            </div>

            <div className="field">
              <label>Berlaku Sampai (opsional)</label>
              <input
                name="validUntil"
                type="datetime-local"
                defaultValue={editVoucher?.validUntil ? toWIBInput(editVoucher.validUntil) : ""}
              />
            </div>

            <div className="field" style={{ display: "flex", alignItems: "center", gap: ".6rem", margin: "0.5rem 0 1rem" }}>
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={editVoucher?.isActive ?? true}
                style={{ width: "auto" }}
                id="fVoucherActive"
              />
              <label htmlFor="fVoucherActive" style={{ margin: 0, cursor: "pointer" }}>
                Aktifkan Voucher
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              {editVoucher && (
                <Link href="/webadmin/voucher" className="btn btn-line btn-sm">
                  Batal
                </Link>
              )}
              <button type="submit" className="btn btn-purple btn-sm">
                {editVoucher ? "Simpan Perubahan" : "Tambah Voucher"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <p className="adm-note" style={{ marginTop: "1.2rem" }}>
        Voucher berlaku global — bisa dipakai peserta saat mendaftar program berbayar maupun saat klaim paket sertifikat webinar.
      </p>
    </>
  );
}
