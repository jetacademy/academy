import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminRegistrationForm from "@/components/AdminRegistrationForm";
import Link from "next/link";

export default async function AdminPendaftarEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [registration, programs] = await Promise.all([
    prisma.registration.findUnique({ where: { id } }),
    prisma.program.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  if (!registration) notFound();

  return (
    <>
      <div className="adm-head">
        <h1>Edit Pendaftar: {registration.name}</h1>
        <Link href="/webadmin/pendaftar" className="btn btn-sm">
          ← Kembali ke List
        </Link>
      </div>
      <AdminRegistrationForm registration={registration} programs={programs} />
    </>
  );
}
