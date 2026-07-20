import { saveProgram } from "@/app/webadmin/actions";
import type { Deliverable } from "@/lib/fallback";
import ThumbnailUploader from "@/components/ThumbnailUploader";
import { toWIBInput } from "@/lib/format";

type ProgramRow = {
  id: string; slug: string; type: string; title: string; tagline: string; description: string;
  emoji: string; imageUrl?: string | null; mentorName: string; mentorBio: string; materi: unknown; deliverables: unknown;
  guarantee: string | null; scheduleAt: Date; durationLabel: string;
  zoomLink: string | null; waGroupLink: string | null; lmsLink: string | null;
  price: number; priceOld: number | null; certPrice: number; certPriceOld: number | null;
  seatsLeft: number | null; passingScore: number; isActive: boolean;
  isFeatured?: boolean;
  certClaimOpen?: boolean;
  categoryId?: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

/** Format Date → nilai input datetime-local (dikonversi dari UTC ke WIB) */
function toLocalInput(d: Date): string {
  return toWIBInput(d);
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="form-section">
      <header>
        <h3>{title}</h3>
        {desc && <p>{desc}</p>}
      </header>
      <div className="fs-body">{children}</div>
    </section>
  );
}

export default function ProgramForm({
  program,
  categories = [],
}: {
  program?: ProgramRow;
  categories?: CategoryRow[];
}) {
  const materi = Array.isArray(program?.materi) ? (program.materi as string[]).join("\n") : "";
  const deliverables = Array.isArray(program?.deliverables)
    ? (program.deliverables as Deliverable[]).map((d) => `${d.label} | ${d.value}`).join("\n")
    : "";

  return (
    <form action={saveProgram}>
      {program && <input type="hidden" name="id" value={program.id} />}

      <Section title="1. Informasi Dasar" desc="Identitas program: nama, alamat halaman, dan jenisnya.">
        <div className="field">
          <label>Judul Program</label>
          <input name="title" defaultValue={program?.title} placeholder="cth: Workshop Excel 1 Hari" required />
        </div>
        <div className="field">
          <label>Slug URL</label>
          <input name="slug" defaultValue={program?.slug} placeholder="cth: workshop-excel" required />
          <span className="adm-note">Menjadi alamat halaman: /program/<b>slug</b>. Huruf kecil dan tanda hubung saja.</span>
        </div>
        <div className="field">
          <label>Kategori Program</label>
          <select name="categoryId" defaultValue={program?.categoryId ?? ""}>
            <option value="">-- Tanpa Kategori --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Tipe Program</label>
          <select name="type" defaultValue={program?.type ?? "WEBINAR"}>
            <option value="WEBINAR">Webinar — gratis ikut, sertifikat berbayar</option>
            <option value="KELAS">Kelas Online / LMS — berbayar</option>
            <option value="WORKSHOP">Workshop — berbayar</option>
            <option value="BOOTCAMP">Bootcamp — berbayar</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", gridColumn: "1 / -1", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
            <input type="checkbox" name="isActive" defaultChecked={program?.isActive ?? true} style={{ width: "auto" }} id="fAktif" />
            <label htmlFor="fAktif" style={{ margin: 0, fontWeight: 700, cursor: "pointer" }}>Tampilkan di website (aktif)</label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
            <input type="checkbox" name="isFeatured" defaultChecked={program?.isFeatured ?? false} style={{ width: "auto" }} id="fUnggulan" />
            <label htmlFor="fUnggulan" style={{ margin: 0, fontWeight: 700, cursor: "pointer" }}>Jadikan Program Unggulan</label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
            <input type="checkbox" name="certClaimOpen" defaultChecked={program?.certClaimOpen ?? false} style={{ width: "auto" }} id="fCertClaim" />
            <label htmlFor="fCertClaim" style={{ margin: 0, fontWeight: 700, cursor: "pointer", color: "var(--green)" }}>
              🎓 Buka Klaim Sertifikat
            </label>
          </div>
        </div>
        {/* Hint jika certClaimOpen aktif */}
        {program?.certClaimOpen && (
          <div style={{ gridColumn: "1 / -1", padding: ".7rem 1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: ".82rem", color: "#166534" }}>
            ✅ <strong>Klaim Sertifikat TERBUKA.</strong> Peserta yang sudah terdaftar dapat melihat tombol klaim sertifikat di dashboard mereka.
          </div>
        )}
        {!(program?.certClaimOpen) && program?.id && (
          <div style={{ gridColumn: "1 / -1", padding: ".7rem 1rem", background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, fontSize: ".82rem", color: "#92400e" }}>
            🔒 <strong>Klaim Sertifikat TERKUNCI.</strong> Centang checkbox di atas lalu simpan untuk membuka akses klaim sertifikat bagi peserta.
          </div>
        )}
      </Section>

      <Section title="2. Jadwal & Kuota" desc="Kapan program dimulai dan berapa kursi tersedia.">
        <div className="field">
          <label>Jadwal Mulai</label>
          <input type="datetime-local" name="scheduleAt" defaultValue={toLocalInput(program?.scheduleAt ?? new Date())} required />
        </div>
        <div className="field">
          <label>Label Durasi</label>
          <input name="durationLabel" defaultValue={program?.durationLabel ?? "2 jam · live Zoom"} placeholder="cth: 2 jam · live Zoom" />
        </div>
        <div className="field">
          <label>Sisa Kursi (opsional)</label>
          <input name="seatsLeft" inputMode="numeric" defaultValue={program?.seatsLeft ?? ""} />
          <span className="adm-note">Diisi = tampil sebagai info keterbatasan kursi di halaman penjualan. Kosongkan jika tidak perlu.</span>
        </div>
      </Section>

      <Section title="3. Harga" desc="Semua harga dalam Rupiah, tanpa titik. Program harga 0 = gratis (webinar).">
        <div className="field">
          <label>Harga Program</label>
          <input name="price" inputMode="numeric" defaultValue={program?.price ?? 0} />
        </div>
        <div className="field">
          <label>Harga Coret Program (opsional)</label>
          <input name="priceOld" inputMode="numeric" defaultValue={program?.priceOld ?? ""} />
        </div>
        <div className="field">
          <label>Harga Paket Sertifikat</label>
          <input name="certPrice" inputMode="numeric" defaultValue={program?.certPrice ?? 49000} />
          <span className="adm-note">Hanya berlaku untuk webinar gratis: peserta membayar ini untuk klaim sertifikat.</span>
        </div>
        <div className="field">
          <label>Harga Coret Sertifikat (opsional)</label>
          <input name="certPriceOld" inputMode="numeric" defaultValue={program?.certPriceOld ?? ""} />
        </div>
      </Section>

      <Section title="4. Halaman Penjualan" desc="Konten yang tampil di halaman program untuk meyakinkan calon peserta.">
        <div className="field full">
          <label>Tagline</label>
          <input name="tagline" defaultValue={program?.tagline} placeholder="cth: Pulang Workshop Ini, Laporan Bulananmu Jadi Otomatis." required />
          <span className="adm-note">Janji hasil akhir yang spesifik — bukan daftar ilmu.</span>
        </div>
        <div className="field full">
          <label>Deskripsi Singkat</label>
          <input name="description" defaultValue={program?.description} required />
        </div>
        <ThumbnailUploader name="imageUrl" defaultValue={program?.imageUrl ?? ""} />
        <div className="field">
          <label>Emoji Kartu (jika tanpa gambar)</label>
          <input name="emoji" defaultValue={program?.emoji ?? "🎓"} />
        </div>
        <div className="field full">
          <label>Poin Materi — satu per baris</label>
          <textarea name="materi" defaultValue={materi} rows={5} placeholder={"Riset pasar dalam 15 menit\nKonten yang menjual"} />
        </div>
        <div className="field full">
          <label>Value Stack — format per baris: Label | nilai rupiah</label>
          <textarea name="deliverables" defaultValue={deliverables} rows={4} placeholder={"e-Sertifikat resmi ber-QR | 149000\nRekaman full | 99000\nGrup alumni | 0"} />
          <span className="adm-note">Nilai 0 ditampilkan sebagai &ldquo;termasuk&rdquo;.</span>
        </div>
        <div className="field full">
          <label>Teks Garansi (opsional)</label>
          <input name="guarantee" defaultValue={program?.guarantee ?? ""} placeholder="Garansi 100% uang kembali jika…" />
        </div>
      </Section>

      <Section title="5. Mentor" desc="Ditampilkan di halaman penjualan dan sertifikat.">
        <div className="field">
          <label>Nama Mentor</label>
          <input name="mentorName" defaultValue={program?.mentorName} required />
        </div>
        <div className="field">
          <label>Bio Singkat Mentor</label>
          <input name="mentorBio" defaultValue={program?.mentorBio} required />
        </div>
      </Section>

      <Section title="6. Link Akses Peserta" desc="Dikirim otomatis via WhatsApp & email setelah pendaftaran/pembayaran.">
        <div className="field">
          <label>Link Zoom</label>
          <input name="zoomLink" defaultValue={program?.zoomLink ?? ""} placeholder="https://zoom.us/j/…" />
        </div>
        <div className="field">
          <label>Link Grup WhatsApp</label>
          <input name="waGroupLink" defaultValue={program?.waGroupLink ?? ""} placeholder="https://chat.whatsapp.com/…" />
        </div>
        <div className="field full">
          <label>Link LMS Eksternal (opsional)</label>
          <input name="lmsLink" defaultValue={program?.lmsLink ?? ""} placeholder="https://…" />
          <span className="adm-note">Kosongkan jika memakai LMS bawaan (tab Kurikulum). Skor lulus &amp; kriteria sertifikat diatur di tab Kelulusan.</span>
        </div>
      </Section>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: ".4rem" }}>
        <button type="submit" className="btn btn-purple">{program ? "Simpan Perubahan" : "Buat Program"}</button>
      </div>
    </form>
  );
}
