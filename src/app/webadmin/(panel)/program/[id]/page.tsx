import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

  // Ambil certClaimOpen via raw SQL agar tidak bergantung pada cache Prisma client
  let certClaimOpen = false;
  try {
    type RawRow = { certClaimOpen: number };
    const rows = await prisma.$queryRaw<RawRow[]>(
      Prisma.sql`SELECT certClaimOpen FROM \`program\` WHERE id = ${id} LIMIT 1`
    );
    if (rows[0]) certClaimOpen = rows[0].certClaimOpen === 1;
  } catch {
    // silent fallback
  }

  return (
    <>
      {e === "slug" && (
        <div className="adm-alert err">Slug tersebut sudah dipakai program lain. Gunakan slug yang berbeda.</div>
      )}
      {e === "lengkapi" && <div className="adm-alert err">Judul dan slug wajib diisi.</div>}
      <ProgramForm program={{ ...program, certClaimOpen }} categories={categories} />
    </>
  );
}
