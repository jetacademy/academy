import { prisma } from "@/lib/prisma";
import AdminRegistrationForm from "@/components/AdminRegistrationForm";
import Link from "next/link";

export default async function AdminPendaftarNew() {
  const programs = await prisma.program.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <>
      <div className="adm-head">
        <h1>Pendaftar Baru (Manual)</h1>
        <Link href="/webadmin/pendaftar" className="btn btn-sm">
          ← Kembali ke List
        </Link>
      </div>
      <AdminRegistrationForm programs={programs} />
    </>
  );
}
