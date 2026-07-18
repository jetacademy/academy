import { prisma } from "@/lib/prisma";
import { sendWa } from "@/lib/wa";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 menit

/** Generate kode OTP 6 digit acak */
function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Kirim OTP ke nomor WhatsApp member.
 * Simpan OTP ke DB, hapus OTP lama yang belum dipakai.
 */
export async function sendOtp(identifier: string): Promise<{ ok: boolean; error?: string }> {
  // Cari apakah identifier terdaftar
  const exists = await prisma.registration.findFirst({
    where: {
      OR: [{ email: identifier }, { whatsapp: identifier }],
    },
  });
  if (!exists) {
    return { ok: false, error: "Nomor WhatsApp/Email belum terdaftar." };
  }

  // Hapus OTP lama yang sudah expire (cleanup global, bukan hanya identifier ini)
  // Dijalankan setiap kali ada permintaan OTP — O(1) karena index [expiresAt]
  await (prisma as any).otpCode.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  // Cek apakah sudah ada OTP aktif (mencegah spam)
  const activeOtp = await (prisma as any).otpCode.findFirst({
    where: { identifier, used: false, expiresAt: { gte: new Date() } },
  });
  if (activeOtp) {
    const remaining = Math.ceil((activeOtp.expiresAt.getTime() - Date.now()) / 1000);
    return { ok: false, error: `Kode OTP sudah dikirim. Coba lagi dalam ${remaining} detik.` };
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await (prisma as any).otpCode.create({
    data: { identifier, code, expiresAt },
  });

  // Kirim via WhatsApp
  const waNumber = exists.whatsapp;
  const message = `*Jetschool Academy* — Kode verifikasi Anda: *${code}*\n\nKode berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.`;
  await sendWa(waNumber, message).catch((err) => {
    console.error("[otp] Gagal kirim WA:", err);
  });

  return { ok: true };
}

/**
 * Verifikasi kode OTP.
 * Jika valid: tandai used=true dan buat session.
 */
export async function verifyOtp(
  identifier: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const otp = await (prisma as any).otpCode.findFirst({
    where: {
      identifier,
      code,
      used: false,
      expiresAt: { gte: new Date() },
    },
  });

  if (!otp) {
    return { ok: false, error: "Kode OTP tidak valid atau sudah kadaluarsa." };
  }

  // Tandai sudah dipakai
  await (prisma as any).otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return { ok: true };
}
