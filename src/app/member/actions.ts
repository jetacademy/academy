"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createMemberSession, destroyMemberSession, getMemberSession } from "@/lib/member-auth";
import { issueCertificate, checkCertEligibility } from "@/lib/certificates";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendOtp, verifyOtp } from "@/lib/otp";

async function loginByIdentifier(cleanVal: string): Promise<{ ok?: boolean; error?: string }> {
  // Cari apakah ada pendaftaran dengan WhatsApp atau Email tersebut
  const exists = await prisma.registration.findFirst({
    where: {
      OR: [{ email: cleanVal }, { whatsapp: cleanVal }],
    },
  });

  if (!exists) {
    return {
      error: "Nomor WhatsApp atau Email belum terdaftar pada program apa pun. Silakan mendaftar terlebih dahulu.",
    };
  }

  await createMemberSession(cleanVal);
  return { ok: true };
}

/**
 * Kirim kode OTP ke WhatsApp/Email member untuk login.
 */
export async function memberSendOtp(identifier: string) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "member-otp";
  const limit = checkRateLimit(`member-otp:${ip}`, 3, 60_000);
  if (!limit.ok) return { error: "Terlalu banyak permintaan OTP. Coba lagi nanti." };

  const cleanVal = identifier.trim();
  if (!cleanVal) return { error: "WhatsApp atau Email tidak boleh kosong." };

  return sendOtp(cleanVal);
}

/**
 * Verifikasi OTP dan login.
 */
export async function memberVerifyOtp(identifier: string, code: string) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "member-verify";
  const limit = checkRateLimit(`member-verify:${ip}`, 5, 60_000);
  if (!limit.ok) return { error: "Terlalu banyak percobaan. Coba lagi nanti." };

  const cleanVal = identifier.trim();
  const cleanCode = code.trim();
  if (!cleanVal || !cleanCode) return { error: "Data tidak lengkap." };

  const verified = await verifyOtp(cleanVal, cleanCode);
  if (!verified.ok) return verified;

  return loginByIdentifier(cleanVal);
}

/**
 * Login fallback tanpa Google (mode dev / Google belum dikonfigurasi).
 * Di produksi dengan Google aktif, jalur ini ditolak — wajib lewat token terverifikasi.
 */
export async function memberLogin(identifier: string) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "member-login";
  const limit = checkRateLimit(`member-login:${ip}`, 10, 60_000);
  if (!limit.ok) return { error: "Terlalu banyak percobaan login. Coba lagi nanti." };

  const cleanVal = identifier.trim();
  if (!cleanVal) {
    return { error: "WhatsApp atau Email tidak boleh kosong." };
  }

  const googleConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  if (googleConfigured && process.env.NODE_ENV === "production") {
    return { error: "Silakan masuk menggunakan tombol Google resmi." };
  }

  return loginByIdentifier(cleanVal);
}

/** Login dengan Google — ID token diverifikasi ke server Google, bukan dipercaya dari client. */
export async function memberLoginWithGoogle(credential: string) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return { error: "Login Google belum dikonfigurasi." };

  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { error: "Token Google tidak valid. Silakan coba lagi." };
    const payload = (await res.json()) as { aud?: string; email?: string; email_verified?: string };

    if (payload.aud !== clientId || !payload.email || payload.email_verified !== "true") {
      return { error: "Verifikasi akun Google gagal. Silakan coba lagi." };
    }

    return loginByIdentifier(payload.email.trim());
  } catch {
    return { error: "Gagal menghubungi server Google. Silakan coba lagi." };
  }
}

export async function memberLogout() {
  await destroyMemberSession();
}

/** Ambil registrasi + validasi bahwa sesi member saat ini adalah pemiliknya */
async function getOwnedRegistration(registrationId: string) {
  const sessionVal = await getMemberSession();
  if (!sessionVal) return null;
  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { program: true },
  });
  if (!reg) return null;
  if (reg.email !== sessionVal && reg.whatsapp !== sessionVal) return null;
  return reg;
}

export async function completeLesson(registrationId: string, lessonId: string) {
  const reg = await getOwnedRegistration(registrationId);
  if (!reg) return { error: "Sesi tidak valid." };

  // Cek akses pembayaran untuk program berbayar
  if (reg.status === "REGISTERED" && reg.program.price > 0) {
    return { error: "Selesaikan pembayaran terlebih dahulu." };
  }

  // Pastikan lesson memang bagian dari program yang diikuti
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson || lesson.module.programId !== reg.programId) {
    return { error: "Materi tidak ditemukan." };
  }

  // Materi kuis tidak bisa ditandai selesai manual — harus lulus kuisnya
  if (lesson.type === "QUIZ") {
    const passedAttempt = await prisma.testAttempt.findFirst({
      where: { registrationId, lessonId, passed: true },
    });
    if (!passedAttempt) return { error: "Selesaikan kuis dengan skor lulus terlebih dahulu." };
  }

  await prisma.completion.upsert({
    where: { registrationId_lessonId: { registrationId, lessonId } },
    create: { registrationId, lessonId },
    update: {},
  });
  revalidatePath(`/member/lms/${registrationId}`);
  return { ok: true };
}

/**
 * Nilai kuis materi (lesson type QUIZ). Kunci jawaban hanya di server.
 * Jika lulus → materi otomatis ditandai selesai.
 */
export async function submitLessonQuiz(
  registrationId: string,
  lessonId: string,
  answers: Record<string, string>
) {
  const reg = await getOwnedRegistration(registrationId);
  if (!reg) return { error: "Sesi tidak valid. Silakan login ulang." };

  // Cek akses pembayaran untuk program berbayar
  if (reg.status === "REGISTERED" && reg.program.price > 0) {
    return { error: "Selesaikan pembayaran terlebih dahulu." };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true, questions: { orderBy: { order: "asc" } } },
  });
  if (!lesson || lesson.module.programId !== reg.programId || lesson.type !== "QUIZ") {
    return { error: "Kuis tidak ditemukan." };
  }
  if (lesson.questions.length === 0) {
    return { error: "Soal kuis belum tersedia. Hubungi admin." };
  }

  // batas percobaan per kuis (0 = tak terbatas); yang sudah lulus tidak dibatasi ulang
  if (reg.program.maxTestAttempts > 0) {
    const alreadyPassed = await prisma.testAttempt.findFirst({
      where: { registrationId, lessonId, passed: true },
    });
    if (!alreadyPassed) {
      const attemptCount = await prisma.testAttempt.count({ where: { registrationId, lessonId } });
      if (attemptCount >= reg.program.maxTestAttempts) {
        return { error: `Batas ${reg.program.maxTestAttempts}x percobaan untuk tes ini sudah habis. Silakan hubungi admin.` };
      }
    }
  }

  const correctCount = lesson.questions.filter((q) => answers[q.id] === q.correct).length;
  const score = Math.round((correctCount / lesson.questions.length) * 100);
  const passingScore = lesson.passingScore ?? reg.program.passingScore;
  const passed = score >= passingScore;

  // Simpan dalam transaksi — atomic: attempt + completion
  await prisma.$transaction(async (tx) => {
    await tx.testAttempt.create({
      data: { registrationId, lessonId, score, passed },
    });
    if (passed) {
      await tx.completion.upsert({
        where: { registrationId_lessonId: { registrationId, lessonId } },
        create: { registrationId, lessonId },
        update: {},
      });
    }
  });

  revalidatePath(`/member/lms/${registrationId}`);
  return { ok: true, passed, score, passingScore };
}

/**
 * Klaim sertifikat — syarat mengikuti kriteria kelulusan program:
 * penyelesaian semua materi, atau lulus semua tes dalam kurikulum.
 */
export async function claimLessonsCertificate(registrationId: string) {
  const reg = await getOwnedRegistration(registrationId);
  if (!reg) return { error: "Sesi tidak valid. Silakan login ulang." };

  if (reg.status === "REGISTERED" && (reg.program.price > 0 || reg.program.certPrice > 0)) {
    return { error: "Selesaikan pembayaran terlebih dahulu." };
  }

  const check = await checkCertEligibility(registrationId, reg.program);
  if (!check.eligible) {
    return { error: check.reason ?? "Syarat kelulusan belum terpenuhi." };
  }

  const cert = await issueCertificate(registrationId);
  revalidatePath(`/member/lms/${registrationId}`);
  revalidatePath("/member");
  return { ok: true, certUrl: cert.url };
}
