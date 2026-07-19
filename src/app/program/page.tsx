import { getPrograms } from "@/lib/programs";
import { prisma } from "@/lib/prisma";
import ProgramListClient from "@/components/ProgramListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kursus AI Bersertifikat — Semua Program Pelatihan",
  description:
    "Jelajahi semua kursus AI, webinar gratis, kelas online, workshop, dan bootcamp AI bersertifikat di Jetschool Academy.",
  alternates: { canonical: "/program" },
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
