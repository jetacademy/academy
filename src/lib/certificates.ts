import { prisma } from "@/lib/prisma";
import { sendWa, msgCertificate } from "@/lib/wa";
import { sendEmail, getCertEmailHtml } from "@/lib/email";
import { formatJadwal } from "@/lib/format";

const CERT_CLAIM_DELAY_MS = 24 * 60 * 60 * 1000; // 1×24 jam setelah sesi berakhir

/**
 * Sakelar global penerbitan sertifikat (`SystemSetting.certIssuanceEnabled`) — dipakai admin
 * utk menghentikan sementara penerbitan sertifikat BARU di seluruh situs (mis. lagi ada bug
 * yang perlu diuji). Gagal baca (mis. di unit test tanpa mock model ini) DIANGGAP AKTIF —
 * supaya kegagalan infra tidak diam-diam mengunci seluruh sistem sertifikat.
 */
export async function isCertIssuanceEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { id: "singleton" } });
    return setting?.certIssuanceEnabled ?? true;
  } catch {
    return true;
  }
}

/**
 * Terbitkan sertifikat dengan nomor random (JSA-<tahun>-<8 hex>),
 * set status PASSED, lalu kirim notifikasi WA + email (best-effort).
 * Idempoten: jika sertifikat sudah ada, kembalikan yang lama.
 */
export async function issueCertificate(registrationId: string): Promise<{ number: string; url: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { certificate: true, program: true, batch: true },
  });
  if (!reg) throw new Error("Registrasi tidak ditemukan.");

  if (reg.certificate) {
    return { number: reg.certificate.number, url: `${baseUrl}/sertifikat/${reg.certificate.number}` };
  }

  const program = reg.program;
  const year = (reg.batch?.scheduleAt ?? program.scheduleAt).getFullYear();

  let progCode = "GEN";
  if (program.slug.includes("guru") || program.slug.includes("teacher")) {
    progCode = "TCH";
  } else {
    progCode = program.slug.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "GEN";
  }

  let batchNumStr = "001";
  if (reg.batch) {
    const previousBatchesCount = await prisma.programBatch.count({
      where: {
        programId: reg.programId,
        scheduleAt: {
          lt: reg.batch.scheduleAt,
        },
      },
    });
    batchNumStr = String(previousBatchesCount + 1).padStart(3, "0");
  }

  let sequence = 1;
  const existingCount = await prisma.certificate.count({
    where: {
      registration: {
        programId: reg.programId,
        batchId: reg.batchId,
      },
    },
  });
  sequence = existingCount + 1;

  let number = `JS-${progCode}-${year}-B${batchNumStr}-${String(sequence).padStart(5, "0")}`;

  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const dupe = await prisma.certificate.findUnique({ where: { number } });
    if (!dupe) {
      isUnique = true;
    } else {
      sequence++;
      number = `JS-${progCode}-${year}-B${batchNumStr}-${String(sequence).padStart(5, "0")}`;
      attempts++;
    }
  }

  const cert = await prisma.$transaction(async (tx) => {
    const created = await tx.certificate.create({
      data: { registrationId: reg.id, number },
    });
    await tx.registration.update({ where: { id: reg.id }, data: { status: "PASSED" } });
    return created;
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
 * Program WEBINAR: klaim baru terbuka 1×24 jam setelah jadwal sesi (batch bila ada,
 * kalau tidak pakai jadwal program) — cegah klaim sebelum sesi selesai/dimulai.
 * Program tanpa materi sama sekali → layak setelah lewat jeda itu (kalau bukan webinar,
 * langsung layak). Program dengan materi/kuis tetap harus lulus itu di atasnya.
 */
export async function checkCertEligibility(
  registrationId: string,
  program: { id: string; type: string; scheduleAt: Date; completionCriteria: "ALL_LESSONS" | "ALL_QUIZZES" }
): Promise<{ eligible: boolean; reason?: string; availableAt?: Date }> {
  if (!(await isCertIssuanceEnabled())) {
    return {
      eligible: false,
      reason: "Penerbitan sertifikat sedang dihentikan sementara untuk pemeliharaan. Coba lagi nanti atau hubungi admin.",
    };
  }

  if (program.type === "WEBINAR") {
    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: { batch: { select: { scheduleAt: true } } },
    });
    const sessionAt = reg?.batch?.scheduleAt ?? program.scheduleAt;
    const availableAt = new Date(sessionAt.getTime() + CERT_CLAIM_DELAY_MS);
    if (new Date() < availableAt) {
      return {
        eligible: false,
        availableAt,
        reason: `Klaim sertifikat untuk sesi ini baru bisa dilakukan mulai ${formatJadwal(availableAt)} (1×24 jam setelah sesi berakhir).`,
      };
    }
  }

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
