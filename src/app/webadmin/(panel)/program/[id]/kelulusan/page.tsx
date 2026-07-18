import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveGraduationSettings } from "@/app/webadmin/actions";

export default async function AdminKelulusan({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;

  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) notFound();

  const [lessonCount, quizCount] = await Promise.all([
    prisma.lesson.count({ where: { module: { programId: id } } }),
    prisma.lesson.count({ where: { type: "QUIZ", module: { programId: id } } }),
  ]);

  return (
    <>
      {ok && <div className="adm-alert ok">Pengaturan kelulusan tersimpan.</div>}

      <h2 style={{ fontSize: "1.15rem", margin: "0 0 .3rem" }}>Kelulusan &amp; Sertifikat</h2>
      <p className="adm-note" style={{ marginBottom: "1.6rem" }}>
        Tes bukan menu terpisah — tes adalah materi kuis yang Anda taruh bebas di kurikulum
        (awal, tengah, akhir, atau per sub-bab). Di sini Anda menentukan kapan sertifikat terbit.
      </p>

      <form action={saveGraduationSettings}>
        <input type="hidden" name="id" value={program.id} />

        <h3 style={{ fontSize: ".95rem", margin: "0 0 .8rem" }}>1. Syarat Sertifikat Terbit</h3>
        <div className="criteria-grid" style={{ marginBottom: ".6rem" }}>
          <div className="criteria-card">
            <input
              type="radio"
              name="completionCriteria"
              value="ALL_LESSONS"
              id="cr-lessons"
              defaultChecked={program.completionCriteria === "ALL_LESSONS"}
            />
            <label htmlFor="cr-lessons">
              <b>Penyelesaian Modul</b>
              <span>
                Sertifikat terbit setelah <u>semua materi</u> selesai ({lessonCount} materi).
                Materi kuis tetap wajib lulus agar dihitung selesai.
              </span>
            </label>
          </div>

          <div className="criteria-card">
            <input
              type="radio"
              name="completionCriteria"
              value="ALL_QUIZZES"
              id="cr-quiz"
              defaultChecked={program.completionCriteria === "ALL_QUIZZES"}
            />
            <label htmlFor="cr-quiz">
              <b>Hasil Tes</b>
              <span>
                Sertifikat terbit setelah <u>semua tes/kuis</u> dalam kurikulum lulus ({quizCount} tes).
                Materi non-kuis tidak wajib diselesaikan.
                {quizCount === 0 && <em style={{ display: "block", color: "var(--red)", marginTop: ".4rem" }}>Perhatian: belum ada materi kuis di kurikulum.</em>}
              </span>
            </label>
          </div>
        </div>
        <p className="adm-note" style={{ marginBottom: "2rem" }}>
          {lessonCount === 0
            ? "Kurikulum masih kosong — program tanpa materi (mis. webinar murni) menerbitkan sertifikat langsung setelah pembayaran/klaim."
            : "Tambahkan atau atur posisi tes di tab Kurikulum."}
        </p>

        <h3 style={{ fontSize: ".95rem", margin: "0 0 .8rem" }}>2. Jenis Sertifikat</h3>
        <div className="criteria-grid" style={{ marginBottom: "2rem" }}>
          <div className="criteria-card">
            <input
              type="radio"
              name="certKind"
              value="PARTICIPATION"
              id="ck-part"
              defaultChecked={program.certKind === "PARTICIPATION"}
            />
            <label htmlFor="ck-part">
              <b>Sertifikat Keikutsertaan</b>
              <span>Bukti mengikuti kegiatan (participation). Umum untuk webinar/seminar — tidak menyatakan kelulusan.</span>
            </label>
          </div>
          <div className="criteria-card">
            <input
              type="radio"
              name="certKind"
              value="COMPLETION"
              id="ck-comp"
              defaultChecked={program.certKind === "COMPLETION"}
            />
            <label htmlFor="ck-comp">
              <b>Sertifikat Penyelesaian</b>
              <span>Menyatakan peserta menyelesaikan seluruh materi (completion). Umum untuk kelas mandiri/self-paced.</span>
            </label>
          </div>
          <div className="criteria-card">
            <input
              type="radio"
              name="certKind"
              value="ACHIEVEMENT"
              id="ck-ach"
              defaultChecked={program.certKind === "ACHIEVEMENT"}
            />
            <label htmlFor="ck-ach">
              <b>Sertifikat Kelulusan</b>
              <span>Menyatakan peserta lulus penilaian (achievement). Paling kuat nilainya — pakai bila kelulusan berbasis tes.</span>
            </label>
          </div>
        </div>

        <h3 style={{ fontSize: ".95rem", margin: "0 0 .8rem" }}>3. Aturan Tes/Kuis</h3>
        <div className="adm-form" style={{ maxWidth: "40rem", marginBottom: "1.6rem" }}>
          <div className="field">
            <label>Skor Minimal Lulus Tes (0–100)</label>
            <input name="passingScore" inputMode="numeric" defaultValue={program.passingScore} />
            <span className="adm-note">Berlaku untuk semua kuis, kecuali kuis yang diberi skor lulus khusus di editornya.</span>
          </div>
          <div className="field">
            <label>Batas Percobaan per Tes (0 = tak terbatas)</label>
            <input name="maxTestAttempts" inputMode="numeric" defaultValue={program.maxTestAttempts} />
            <span className="adm-note">Jika batas habis dan belum lulus, peserta diarahkan menghubungi admin.</span>
          </div>
          <div className="full">
            <button type="submit" className="btn btn-purple">Simpan Pengaturan</button>
          </div>
        </div>
      </form>

      <div style={{ padding: "1.4rem", background: "var(--white)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <b style={{ fontSize: ".95rem" }}>Desain Sertifikat</b>
          <p className="adm-note" style={{ marginTop: ".2rem" }}>
            Latar, teks, tabel bobot JP, tanda tangan, dan QR verifikasi diatur di tab Desain Sertifikat.
            {program.certBgUrl ? " Template kustom sudah terpasang." : " Saat ini memakai desain bawaan."}
          </p>
        </div>
        <Link href={`/webadmin/program/${program.id}/cert`} className="btn btn-sm btn-ink">Buka Desainer</Link>
      </div>
    </>
  );
}
