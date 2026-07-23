import { getAffiliateSettings } from "@/lib/affiliate";
import { saveAffiliateSettings } from "../../../affiliate-actions";

export const dynamic = "force-dynamic";

export default async function AdminAffiliateSettings({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const settings = await getAffiliateSettings();

  return (
    <>
      <div className="adm-head">
        <h1>Pengaturan Program Affiliate</h1>
      </div>

      {ok === "1" && <div className="adm-alert ok">Pengaturan berhasil disimpan.</div>}

      <form action={saveAffiliateSettings} className="adm-form" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: "48rem" }}>
        <div className="field">
          <label>Tipe Komisi Default (untuk affiliate baru)</label>
          <select name="defaultCommissionType" defaultValue={settings.defaultCommissionType}>
            <option value="PERCENT">Persen (%)</option>
            <option value="FIXED">Nominal Tetap (Rp)</option>
          </select>
        </div>
        <div className="field">
          <label>Nilai Komisi Default</label>
          <input name="defaultCommissionValue" type="number" min={0} defaultValue={settings.defaultCommissionValue} required />
        </div>

        <div className="field">
          <label>Tipe Diskon Customer Default</label>
          <select name="defaultDiscountType" defaultValue={settings.defaultDiscountType}>
            <option value="PERCENT">Persen (%)</option>
            <option value="FIXED">Nominal Tetap (Rp)</option>
          </select>
        </div>
        <div className="field">
          <label>Nilai Diskon Customer Default</label>
          <input name="defaultDiscountValue" type="number" min={0} defaultValue={settings.defaultDiscountValue} required />
        </div>

        <div className="field">
          <label>Minimal Sekali Penarikan (Rp)</label>
          <input name="minWithdrawal" type="number" min={0} defaultValue={settings.minWithdrawal} required />
        </div>
        <div className="field">
          <label>Masa Tahan Komisi (hari)</label>
          <input name="holdDays" type="number" min={0} defaultValue={settings.holdDays} required />
          <span className="adm-note">Komisi baru bisa ditarik setelah sekian hari — buffer jika ada refund/pembatalan.</span>
        </div>

        <div className="field">
          <label>Masa Berlaku Cookie Referral (hari)</label>
          <input name="cookieDays" type="number" min={1} defaultValue={settings.cookieDays} required />
          <span className="adm-note">Berapa lama link ?ref=KODE &ldquo;mengingat&rdquo; affiliate setelah pengunjung mengklik.</span>
        </div>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Syarat &amp; Ketentuan Program Affiliate (opsional, ditampilkan di dashboard affiliate)</label>
          <textarea name="termsText" rows={5} defaultValue={settings.termsText ?? ""} />
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-purple btn-sm">Simpan Pengaturan</button>
        </div>
      </form>
    </>
  );
}
