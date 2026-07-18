import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuestionEditor, { QuestionNav } from "@/components/QuestionEditor";

export default async function AdminSoalEdit({
  params,
}: {
  params: Promise<{ id: string; qid: string }>;
}) {
  const { id, qid } = await params;
  const question = await prisma.question.findUnique({
    where: { id: qid },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          questions: { orderBy: { order: "asc" }, select: { id: true } },
        },
      },
    },
  });
  if (!question || question.programId !== id) notFound();

  // Tombol kembali: ke materi kuisnya (soal lama tanpa materi → kurikulum)
  const backHref = question.lessonId
    ? `/webadmin/program/${id}/lms/lesson/${question.lessonId}`
    : `/webadmin/program/${id}/lms`;
  const backLabel = question.lessonId ? "Kembali ke materi kuis" : "Kembali ke kurikulum";

  const siblings = question.lesson?.questions ?? [];
  const currentIndex = siblings.findIndex((q) => q.id === question.id);

  return (
    <div className="editor-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        <div>
          {question.lesson ? (
            <Link href={backHref} style={{ color: "var(--ink-faint)", fontSize: ".8rem", fontWeight: 700 }}>
              ← Kuis: {question.lesson.title}
            </Link>
          ) : (
            <Link href={backHref} style={{ color: "var(--ink-faint)", fontSize: ".8rem", fontWeight: 700 }}>
              ← Kurikulum
            </Link>
          )}
          <h2 style={{ fontSize: "1.15rem", margin: ".3rem 0 0" }}>
            Edit Soal{currentIndex !== -1 ? ` ${currentIndex + 1}` : ""}
            {siblings.length > 0 && (
              <span style={{ color: "var(--ink-faint)", fontWeight: 700 }}> dari {siblings.length}</span>
            )}
          </h2>
        </div>
        {question.lesson && (
          <QuestionNav
            programId={id}
            lessonId={question.lesson.id}
            questions={siblings}
            currentId={question.id}
          />
        )}
      </div>

      <QuestionEditor
        programId={id}
        lessonId={question.lessonId}
        question={question}
        backHref={backHref}
        backLabel={backLabel}
        showSaveAndNext={Boolean(question.lessonId)}
      />
    </div>
  );
}
