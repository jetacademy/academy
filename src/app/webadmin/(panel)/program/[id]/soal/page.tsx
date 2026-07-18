import { redirect } from "next/navigation";

/** Tidak ada lagi post-test terpisah — soal dikelola per materi kuis di Kurikulum. */
export default async function AdminSoal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/webadmin/program/${id}/lms`);
}
