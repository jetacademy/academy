import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProgramForm from "@/components/ProgramForm";

export default async function AdminProgramEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { id } = await params;
  const { e } = await searchParams;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) notFound();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <>
      {e === "slug" && (
        <div className="adm-alert err">Slug tersebut sudah dipakai program lain. Gunakan slug yang berbeda.</div>
      )}
      {e === "lengkapi" && <div className="adm-alert err">Judul dan slug wajib diisi.</div>}
      <ProgramForm program={program} categories={categories} />
    </>
  );
}
