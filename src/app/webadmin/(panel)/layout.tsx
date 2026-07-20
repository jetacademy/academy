import { requireAdmin } from "@/lib/admin-auth";
import AdminShell from "@/components/AdminShell";
import "../../globals-admin.css";

export const dynamic = "force-dynamic";

export const metadata = { title: "Panel Admin — Jetschool Academy" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // semua halaman panel butuh login

  return <AdminShell>{children}</AdminShell>;
}
