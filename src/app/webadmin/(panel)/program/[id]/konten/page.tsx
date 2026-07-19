import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import ContentBlockEditor from "@/components/ContentBlockEditor";
import type { ContentBlock } from "@/lib/content-blocks";
import type { Deliverable } from "@/lib/fallback";

export default async function AdminProgramKontenPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) notFound();

  const initialBlocks: ContentBlock[] = Array.isArray(program.contentBlocks) ? (program.contentBlocks as unknown as ContentBlock[]) : [];

  return (
    <>
      <div style={{ marginBottom: "1.2rem" }}>
        <h2 style={{ fontSize: "1.15rem", margin: "0 0 .3rem" }}>Editor Halaman Program</h2>
        <p className="adm-note">
          Susun tampilan halaman publik program ini bebas dari blok teks, gambar, video, daftar poin, value stack, dan kutipan.
          Selama belum ada blok tersimpan, halaman publik tetap memakai layout bawaan (deskripsi/materi/mentor).
        </p>
      </div>
      <ContentBlockEditor
        programId={program.id}
        programSlug={program.slug}
        initialBlocks={initialBlocks}
        legacyProgram={{
          description: program.description,
          materi: Array.isArray(program.materi) ? (program.materi as string[]) : [],
          deliverables: Array.isArray(program.deliverables) ? (program.deliverables as unknown as Deliverable[]) : [],
          mentorName: program.mentorName,
          mentorBio: program.mentorBio,
          guarantee: program.guarantee,
        }}
      />
    </>
  );
}
