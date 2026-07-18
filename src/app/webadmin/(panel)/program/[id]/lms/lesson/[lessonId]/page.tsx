import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveLmsLesson, deleteLmsLesson, deleteQuestion } from "@/app/webadmin/actions";
import LessonFields from "@/components/LessonFields";
import ConfirmButton from "@/components/ConfirmButton";

export default async function AdminLessonEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; lessonId: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id, lessonId } = await params;
  const { ok } = await searchParams;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { select: { id: true, title: true, programId: true, program: { select: { passingScore: true } } } },
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!lesson || lesson.module.programId !== id) notFound();

  const isQuiz = lesson.type === "QUIZ";

  return (
    <div className="editor-wrap">
      {ok === "baru" && (
        <div className="adm-alert ok">Materi kuis dibuat. Sekarang tambahkan soal-soalnya di bagian bawah.</div>
      )}
      {ok === "1" && <div className="adm-alert ok">Soal kuis tersimpan.</div>}

      <div style={{ marginBottom: "1.2rem" }}>
        <Link href={`/webadmin/program/${id}/lms`} style={{ color: "var(--ink-faint)", fontSize: ".8rem", fontWeight: 700 }}>
          ← Kurikulum
        </Link>
        <h2 style={{ fontSize: "1.15rem", margin: ".3rem 0 0" }}>Edit Materi: {lesson.title}</h2>
        <p className="adm-note" style={{ marginTop: ".25rem" }}>Modul: <b>{lesson.module.title}</b></p>
      </div>

      <form action={saveLmsLesson}>
        <input type="hidden" name="id" value={lesson.id} />
        <input type="hidden" name="programId" value={id} />
        <input type="hidden" name="moduleId" value={lesson.module.id} />

        <LessonFields lesson={lesson} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link href={`/webadmin/program/${id}/lms`} className="btn btn-sm">Batal, kembali ke kurikulum</Link>
          <button type="submit" className="btn btn-purple">Simpan Perubahan</button>
        </div>
      </form>

      {/* Soal kuis — daftar ringkas, edit di halaman soal tersendiri */}
      {isQuiz && (
        <div style={{ marginTop: "2.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: ".9rem" }}>
            <div>
              <h3 style={{ fontSize: "1rem", margin: 0 }}>Soal Kuis ({lesson.questions.length})</h3>
              <p className="adm-note" style={{ marginTop: ".2rem" }}>
                Skor lulus kuis ini: <b>{lesson.passingScore ?? lesson.module.program.passingScore}</b>.
              </p>
            </div>
            <Link href={`/webadmin/program/${id}/soal/new?lesson=${lesson.id}`} className="btn btn-purple btn-sm">
              + Tambah Soal
            </Link>
          </div>

          {lesson.questions.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", border: "2px dashed var(--chip)", borderRadius: "var(--r-md)", color: "var(--ink-soft)" }}>
              <p style={{ fontWeight: 700, margin: "0 0 .3rem" }}>Kuis ini belum punya soal</p>
              <p style={{ fontSize: ".85rem", margin: 0 }}>Peserta tidak bisa menyelesaikan materi ini sampai ada soal.</p>
            </div>
          ) : (
            <div className="q-list">
              {lesson.questions.map((q, i) => (
                <div key={q.id} className="q-row">
                  <span className="q-no">{i + 1}</span>
                  <Link href={`/webadmin/program/${id}/soal/${q.id}`} className="q-text" title="Klik untuk mengedit">
                    {q.text}
                  </Link>
                  <span className="badge" style={{ flexShrink: 0 }}>Jawaban: {q.correct}</span>
                  <div style={{ display: "flex", gap: ".4rem", flexShrink: 0 }}>
                    <Link href={`/webadmin/program/${id}/soal/${q.id}`} className="btn btn-sm">Edit</Link>
                    <form action={deleteQuestion}>
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="programId" value={id} />
                      <ConfirmButton className="btn btn-sm btn-danger" message={`Hapus soal ${i + 1}?`}>Hapus</ConfirmButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <form action={deleteLmsLesson} style={{ marginTop: "2.4rem", paddingTop: "1.2rem", borderTop: "1px dashed var(--chip)", textAlign: "right" }}>
        <input type="hidden" name="id" value={lesson.id} />
        <input type="hidden" name="programId" value={id} />
        <ConfirmButton className="btn btn-sm btn-danger" message={`Hapus materi "${lesson.title}" secara permanen? Progres peserta pada materi ini ikut terhapus.`}>
          Hapus Materi Ini
        </ConfirmButton>
      </form>
    </div>
  );
}
