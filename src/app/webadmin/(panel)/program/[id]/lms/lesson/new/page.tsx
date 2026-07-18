import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveLmsLesson } from "@/app/webadmin/actions";
import LessonFields from "@/components/LessonFields";

export default async function AdminLessonBaru({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ module?: string }>;
}) {
  const { id } = await params;
  const { module: moduleId } = await searchParams;

  const mod = moduleId
    ? await prisma.lmsModule.findUnique({ where: { id: moduleId }, select: { id: true, title: true, programId: true } })
    : null;
  if (!mod || mod.programId !== id) notFound();

  return (
    <div className="editor-wrap">
      <div style={{ marginBottom: "1.2rem" }}>
        <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Tambah Materi Baru</h2>
        <p className="adm-note" style={{ marginTop: ".3rem" }}>
          Ke dalam modul: <b>{mod.title}</b>. Untuk materi kuis, soal ditambahkan setelah materi ini disimpan.
        </p>
      </div>

      <form action={saveLmsLesson}>
        <input type="hidden" name="programId" value={id} />
        <input type="hidden" name="moduleId" value={mod.id} />

        <LessonFields />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link href={`/webadmin/program/${id}/lms`} className="btn btn-sm">Batal, kembali ke kurikulum</Link>
          <button type="submit" className="btn btn-purple">Simpan Materi</button>
        </div>
      </form>
    </div>
  );
}
