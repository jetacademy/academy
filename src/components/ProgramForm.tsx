import { saveProgram } from "@/app/webadmin/actions";
import type { Deliverable } from "@/lib/fallback";

type ProgramRow = {
  id: string; slug: string; type: string; title: string; tagline: string; description: string;
  emoji: string; imageUrl?: string | null; mentorName: string; mentorBio: string; materi: unknown; deliverables: unknown;
  guarantee: string | null; scheduleAt: Date; durationLabel: string;
  zoomLink: string | null; waGroupLink: string | null; lmsLink: string | null;
  price: number; priceOld: number | null; certPrice: number; certPriceOld: number | null;
  seatsLeft: number | null; passingScore: number; isActive: boolean;
};

/** Format Date → nilai input datetime-local (waktu server = WIB) */
function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ProgramForm({ program }: { program?: ProgramRow }) {
  const materi = Array.isArray(program?.materi) ? (program.materi as string[]).join("\n") : "";
  const deliverables = Array.isArray(program?.deliverables)
    ? (program.deliverables as Deliverable[]).map((d) => `${d.label} | ${d.value}`).join("\n")
    : "";

  return (
    <form className="adm-form" action={saveProgram}>
      {program && <input type="hidden" name="id" value={program.id} />}

      <div className="field">
        <label>Judul Program</label>
        <input name="title" defaultValue={program?.title} placeholder="cth: Workshop Excel 1 Hari" required />
      </div>
      <div className="field">
        <label>Slug (URL iklan: /program/slug)</label>
        <input name="slug" defaultValue={program?.slug} placeholder="cth: workshop-excel" required />
      </div>

      <div className="field">
        <label>Tipe Program</label>
        <select name="type" defaultValue={program?.type ?? "WEBINAR"}>
          <option value="WEBINAR">Webinar (gratis, sertifikat berbayar)</option>
          <option value="KELAS">Kelas Online / LMS (berbayar)</option>
          <option value="WORKSHOP">Workshop (berbayar)</option>
          <option value="BOOTCAMP">Bootcamp (berbayar)</option>
        </select>
      </div>
      <div className="field">
        <label>Emoji</label>
        <input name="emoji" defaultValue={program?.emoji ?? "🎓"} />
      </div>
      <div className="field full">
        <label>URL Gambar Program (Opsional — untuk Card di Halaman Depan)</label>
        <input name="imageUrl" defaultValue={program?.imageUrl ?? ""} placeholder="cth: /hero2.webp atau URL gambar kustom" />
        <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: "0.2rem", display: "block" }}>
          * Biarkan kosong jika ingin menggunakan tampilan teks saja. Jika diisi, disarankan menggunakan gambar beraspek rasio <strong>16:9 (contoh: 1200x675 px atau 800x450 px)</strong> agar gambar fit penuh secara proporsional tanpa terpotong di halaman depan.
        </span>
      </div>

      <div className="field full">
        <label>Tagline (headline iklan — janji hasil akhir yang spesifik)</label>
        <input name="tagline" defaultValue={program?.tagline} placeholder="cth: Pulang Workshop Ini, Laporan Bulananmu Jadi Otomatis." required />
      </div>
      <div className="field full">
        <label>Deskripsi Singkat</label>
        <input name="description" defaultValue={program?.description} required />
      </div>

      <div className="field">
        <label>Jadwal Mulai</label>
        <input type="datetime-local" name="scheduleAt" defaultValue={toLocalInput(program?.scheduleAt ?? new Date())} required />
      </div>
      <div className="field">
        <label>Label Durasi</label>
        <input name="durationLabel" defaultValue={program?.durationLabel ?? "2 jam · live Zoom"} />
      </div>

      <div className="field">
        <label>Harga Program (Rp — 0 = gratis/webinar)</label>
        <input name="price" inputMode="numeric" defaultValue={program?.price ?? 0} />
      </div>
      <div className="field">
        <label>Harga Coret Program (opsional)</label>
        <input name="priceOld" inputMode="numeric" defaultValue={program?.priceOld ?? ""} />
      </div>

      <div className="field">
        <label>Harga Sertifikat (khusus webinar gratis)</label>
        <input name="certPrice" inputMode="numeric" defaultValue={program?.certPrice ?? 49000} />
      </div>
      <div className="field">
        <label>Harga Coret Sertifikat (opsional)</label>
        <input name="certPriceOld" inputMode="numeric" defaultValue={program?.certPriceOld ?? ""} />
      </div>

      <div className="field">
        <label>Sisa Kursi (opsional, utk urgency)</label>
        <input name="seatsLeft" inputMode="numeric" defaultValue={program?.seatsLeft ?? ""} />
      </div>
      <div className="field">
        <label>Skor Lulus Post-Test (0–100)</label>
        <input name="passingScore" inputMode="numeric" defaultValue={program?.passingScore ?? 60} />
      </div>

      <div className="field">
        <label>Nama Mentor</label>
        <input name="mentorName" defaultValue={program?.mentorName} required />
      </div>
      <div className="field">
        <label>Bio Mentor</label>
        <input name="mentorBio" defaultValue={program?.mentorBio} required />
      </div>

      <div className="field full">
        <label>Materi — satu poin per baris</label>
        <textarea name="materi" defaultValue={materi} placeholder={"Riset pasar dalam 15 menit\nKonten yang menjual\n..."} />
      </div>
      <div className="field full">
        <label>Value Stack — format: Label | nilai rupiah (0 = &ldquo;termasuk&rdquo;)</label>
        <textarea name="deliverables" defaultValue={deliverables} placeholder={"e-Sertifikat resmi ber-QR | 149000\nRekaman full | 99000\nGrup alumni | 0"} />
      </div>
      <div className="field full">
        <label>Teks Garansi (kosongkan jika tidak ada)</label>
        <input name="guarantee" defaultValue={program?.guarantee ?? ""} placeholder="Garansi 100% uang kembali jika..." />
      </div>

      <div className="field">
        <label>Link Zoom (dikirim via WA)</label>
        <input name="zoomLink" defaultValue={program?.zoomLink ?? ""} placeholder="https://zoom.us/j/..." />
      </div>
      <div className="field">
        <label>Link Grup WhatsApp</label>
        <input name="waGroupLink" defaultValue={program?.waGroupLink ?? ""} placeholder="https://chat.whatsapp.com/..." />
      </div>
      <div className="field full">
        <label>Link LMS (kelas online / bonus)</label>
        <input name="lmsLink" defaultValue={program?.lmsLink ?? ""} placeholder="https://..." />
      </div>

      <div className="field full" style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
        <input type="checkbox" name="isActive" defaultChecked={program?.isActive ?? true} style={{ width: "auto" }} id="fAktif" />
        <label htmlFor="fAktif" style={{ margin: 0 }}>Tampilkan di website (aktif)</label>
      </div>

      <div className="full" style={{ display: "flex", gap: "1rem", marginTop: ".5rem" }}>
        <button type="submit" className="btn btn-ink">{program ? "Simpan Perubahan" : "Buat Program"}</button>
      </div>
    </form>
  );
}
