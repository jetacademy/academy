import { redirect } from "next/navigation";

/**
 * Rute lama dari tautan WA/email terdahulu.
 * Post-test terpisah sudah tidak ada — tes dikerjakan di dalam LMS.
 */
export default async function PostTestPage({ params }: { params: Promise<{ registrationId: string }> }) {
  const { registrationId } = await params;
  redirect(`/member/lms/${registrationId}`);
}
