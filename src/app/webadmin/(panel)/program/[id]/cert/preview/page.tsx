import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import CertPreviewClient from "@/components/CertPreviewClient";

export default async function AdminCertPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) notFound();

  return (
    <CertPreviewClient
      program={{
        id: program.id,
        title: program.title,
        certKind: String(program.certKind),
        materi: Array.isArray(program.materi) ? (program.materi as string[]) : [],
        certBgUrl: program.certBgUrl,
        certConfig: program.certConfig,
      }}
    />
  );
}
