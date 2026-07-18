import ProgramForm from "@/components/ProgramForm";
import { prisma } from "@/lib/prisma";

export default async function AdminProgramNew() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return (
    <>
      <div className="adm-head"><h1>Program Baru</h1></div>
      <ProgramForm categories={categories} />
    </>
  );
}
