import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProgramForm from "@/components/ProgramForm";

export default async function AdminProgramEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) notFound();

  return (
    <>
      <div className="adm-head">
        <h1>Edit: {program.title}</h1>
        <div style={{ display: "flex", gap: ".6rem" }}>
          <Link href={`/webadmin/program/${program.id}/soal`} className="btn btn-sm">Kelola Soal</Link>
          <a href={`/program/${program.slug}`} target="_blank" className="btn btn-sm">Lihat Halaman ↗</a>
        </div>
      </div>
      <ProgramForm program={program} />
    </>
  );
}
