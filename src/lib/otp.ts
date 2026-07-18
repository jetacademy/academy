import { prisma } from "@/lib/prisma";
import { sendWa } from "@/lib/wa";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // Cari apakah identifier terdaftar — cek Registration dulu, lalu User
  const existsReg = await prisma.registration.findFirst({
    where: {
      OR: [{ email: identifier }, { whatsapp: identifier }],
    },
  });
  const existsUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { whatsapp: identifier }],
    },
  });
  if (!existsReg && !existsUser) {
    return { ok: false, error: "Nomor WhatsApp/Email belum terdaftar." };
  }

  // Hapus OTP lama yang sudah expire (cleanup global, bukan hanya identifier ini)
  // Dijalankan setiap kali ada permintaan OTP — O(1) karena index [expiresAt]
  await prisma.otpCode.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  // Cek apakah sudah ada OTP aktif (mencegah spam)
  const activeOtp = await prisma.otpCode.findFirst({
    where: { identifier, used: false, expiresAt: { gte: new Date() } },
  });
  if (activeOtp) {
    const remaining = Math.ceil((activeOtp.expiresAt.getTime() - Date.now()) / 1000);
    return { ok: false, error: `Kode OTP sudah dikirim. Coba lagi dalam ${remaining} detik.` };
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await prisma.otpCode.create({
    data: { identifier, code, expiresAt },
  });

  // Kirim via WhatsApp — cari nomor WA dari Registration atau User
  const waNumber = existsReg?.whatsapp ?? existsUser?.whatsapp;
  if (waNumber) {
    const message = `*Jetschool Academy* — Kode verifikasi Anda: *${code}*\n\nKode berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.`;
    await sendWa(waNumber, message).catch((err) => {
      console.error("[otp] Gagal kirim WA:", err);
    });
  }

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
  const otp = await prisma.otpCode.findFirst({
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
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return { ok: true };
}
