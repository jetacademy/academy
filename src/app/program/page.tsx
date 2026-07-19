import { getPrograms } from "@/lib/programs";
import { prisma } from "@/lib/prisma";
import ProgramListClient from "@/components/ProgramListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Semua Program Pelatihan — Jetschool Academy",
  description: "Daftar lengkap program pelatihan, webinar, workshop, dan bootcamp di Jetschool Academy.",
};

export default async function ProgramPage() {
  const { programs } = await getPrograms();
  
  // Ambil semua kategori untuk filter
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    }
  }).catch(() => []);

  return <ProgramListClient initialPrograms={programs} categories={categories} />;
}
