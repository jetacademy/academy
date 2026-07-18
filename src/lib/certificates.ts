import { prisma } from "@/lib/prisma";
import { sendWa, msgCertificate } from "@/lib/wa";
import { sendEmail, getCertEmailHtml } from "@/lib/email";

/**
 * Terbitkan sertifikat bernomor urut (JSA-<tahun>-<serial 4 digit>) untuk sebuah registrasi,
 * set status PASSED, lalu kirim notifikasi WA + email (best-effort).
 * Idempoten: jika sertifikat sudah ada, kembalikan yang lama.
 */
export async function issueCertificate(registrationId: string): Promise<{ number: string; url: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { certificate: true, program: true },
  });
  if (!reg) throw new Error("Registrasi tidak ditemukan.");

  if (reg.certificate) {
    return { number: reg.certificate.number, url: `${baseUrl}/sertifikat/${reg.certificate.number}` };
  }

  const year = new Date().getFullYear();
  const cert = await prisma.$transaction(async (tx) => {
    const created = await tx.certificate.create({
      data: { registrationId: reg.id, number: `TMP-${reg.id}` },
    });
    const number = `JSA-${year}-${String(created.serial).padStart(4, "0")}`;
    await tx.registration.update({ where: { id: reg.id }, data: { status: "PASSED" } });
    return tx.certificate.update({ where: { id: created.id }, data: { number } });
  });

  const certUrl = `${baseUrl}/sertifikat/${cert.number}`;

  // notifikasi — best-effort, jangan gagalkan penerbitan
  await sendWa(reg.whatsapp, msgCertificate(reg.name, cert.number, certUrl)).catch((err) =>
    console.error("Gagal kirim WA sertifikat:", err)
  );
  await sendEmail({
    to: reg.email,
    subject: `Selamat! Sertifikat Resmi Anda Telah Terbit - ${reg.program.title}`,
    html: getCertEmailHtml(reg.name, reg.program.title, certUrl),
  }).catch((err) => console.error("Gagal mengirim email sertifikat:", err));

  return { number: cert.number, url: certUrl };
}

/** Apakah seluruh materi LMS program sudah diselesaikan peserta? */
export async function hasCompletedAllLessons(registrationId: string, programId: string): Promise<{ done: boolean; total: number; completed: number }> {
  const [total, completed] = await Promise.all([
    prisma.lesson.count({ where: { module: { programId } } }),
    prisma.completion.count({ where: { registrationId, lesson: { module: { programId } } } }),
  ]);
  return { done: total > 0 && completed >= total, total, completed };
}

/** Apakah seluruh kuis dalam kurikulum sudah lulus? (kuis selesai = lulus) */
export async function hasPassedAllQuizzes(registrationId: string, programId: string): Promise<{ done: boolean; total: number; completed: number }> {
  const [total, completed] = await Promise.all([
    prisma.lesson.count({ where: { type: "QUIZ", module: { programId } } }),
    prisma.completion.count({ where: { registrationId, lesson: { type: "QUIZ", module: { programId } } } }),
  ]);
  return { done: total > 0 && completed >= total, total, completed };
}

/**
 * Cek kelayakan sertifikat sesuai kriteria program.
 * Program tanpa materi sama sekali (mis. webinar murni) → langsung layak setelah bayar.
 */
export async function checkCertEligibility(
  registrationId: string,
  program: { id: string; completionCriteria: "ALL_LESSONS" | "ALL_QUIZZES" }
): Promise<{ eligible: boolean; reason?: string }> {
  const totalLessons = await prisma.lesson.count({ where: { module: { programId: program.id } } });
  if (totalLessons === 0) return { eligible: true };

  if (program.completionCriteria === "ALL_QUIZZES") {
    const quiz = await hasPassedAllQuizzes(registrationId, program.id);
    if (quiz.total === 0) {
      // tidak ada kuis → jatuh ke penyelesaian materi
      const les = await hasCompletedAllLessons(registrationId, program.id);
      return les.done
        ? { eligible: true }
        : { eligible: false, reason: `Selesaikan semua materi dulu (${les.completed}/${les.total}).` };
    }
    return quiz.done
      ? { eligible: true }
      : { eligible: false, reason: `Lulusi semua tes dulu (${quiz.completed}/${quiz.total} tes lulus).` };
  }

  const les = await hasCompletedAllLessons(registrationId, program.id);
  return les.done
    ? { eligible: true }
    : { eligible: false, reason: `Selesaikan semua materi dulu (${les.completed}/${les.total}).` };
}
