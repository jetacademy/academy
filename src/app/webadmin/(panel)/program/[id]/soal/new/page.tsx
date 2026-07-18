import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuestionEditor, { QuestionNav } from "@/components/QuestionEditor";

/** Tambah soal untuk satu materi kuis (wajib ?lesson=...). */
export default async function AdminSoalBaru({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { lesson: lessonParam, ok } = await searchParams;

  const program = await prisma.program.findUnique({ where: { id }, select: { id: true } });
  if (!program) notFound();

  if (!lessonParam) redirect(`/webadmin/program/${id}/lms`);

  const found = await prisma.lesson.findUnique({
    where: { id: lessonParam },
    select: {
      id: true,
      title: true,
      type: true,
      module: { select: { programId: true } },
      questions: { orderBy: { order: "asc" }, select: { id: true } },
    },
  });
  if (!found || found.module.programId !== id || found.type !== "QUIZ") notFound();

  const backHref = `/webadmin/program/${program.id}/lms/lesson/${found.id}`;

  return (
    <div className="editor-wrap">
      {ok && (
        <div className="adm-alert ok">
          Soal {found.questions.length} tersimpan. Lanjut isi soal berikutnya di bawah.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        <div>
          <Link href={backHref} style={{ color: "var(--ink-faint)", fontSize: ".8rem", fontWeight: 700 }}>
            ← Kuis: {found.title}
          </Link>
          <h2 style={{ fontSize: "1.15rem", margin: ".3rem 0 0" }}>
            Soal Baru <span style={{ color: "var(--ink-faint)", fontWeight: 700 }}>(soal ke-{found.questions.length + 1})</span>
          </h2>
        </div>
        <QuestionNav programId={program.id} lessonId={found.id} questions={found.questions} />
      </div>

      <QuestionEditor
        programId={program.id}
        lessonId={found.id}
        backHref={backHref}
        backLabel="Selesai, kembali ke kuis"
        showSaveAndNext
      />
    </div>
  );
}
