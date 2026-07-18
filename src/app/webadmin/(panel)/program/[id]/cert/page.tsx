import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import CertCustomizer from "@/components/CertCustomizer";

export default async function AdminProgramCertPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) notFound();

  return (
    <>
      <h2 style={{ fontSize: "1.15rem", margin: "0 0 1rem" }}>Kustomisasi Sertifikat</h2>
      <CertCustomizer program={program} />
    </>
  );
}
