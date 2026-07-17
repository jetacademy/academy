import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import CertCustomizer from "@/components/CertCustomizer";

export default async function AdminProgramCertPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const program = await (prisma.program as any).findUnique({
    where: { id },
  });

  if (!program) notFound();

  return (
    <>
      <div className="adm-head">
        <h1>Kustomisasi Sertifikat: {program.title}</h1>
      </div>
      <CertCustomizer program={program} />
    </>
  );
}
