import { prisma } from "@/lib/prisma";
import { sendWa } from "@/lib/wa";
import { sendEmail, getOtpEmailHtml } from "@/lib/email";

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
export async function sendOtp(identifier: string, forceEmail: boolean = false): Promise<{ ok: boolean; channel?: "whatsapp" | "email" | "none"; error?: string }> {
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
    return { ok: false, error: "Nomor WhatsApp atau Email belum terdaftar. Silakan buat akun baru terlebih dahulu." };
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

  let code: string;
  let isNew = false;
  if (activeOtp && forceEmail) {
    code = activeOtp.code;
  } else if (activeOtp) {
    const remaining = Math.ceil((activeOtp.expiresAt.getTime() - Date.now()) / 1000);
    return { ok: false, error: `Kode OTP sudah dikirim. Coba lagi dalam ${remaining} detik.` };
  } else {
    code = generateOtp();
    isNew = true;
  }

  if (isNew) {
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await prisma.otpCode.create({
      data: { identifier, code, expiresAt },
    });
  }

  let waSent = false;
  let emailSent = false;

  if (forceEmail) {
    const emailAddr = existsReg?.email ?? existsUser?.email;
    if (emailAddr) {
      emailSent = await sendEmail({
        to: emailAddr,
        subject: "Kode Verifikasi Jetschool Academy",
        html: getOtpEmailHtml(code),
      }).then(() => true).catch((err) => {
        console.error("[otp] Gagal kirim email (forced):", err);
        return false;
      });
    }
  } else {
    // Kirim via WhatsApp — cari nomor WA dari Registration atau User
    const waNumber = existsReg?.whatsapp ?? existsUser?.whatsapp;
    if (waNumber) {
      const message = `*Jetschool Academy* — Kode verifikasi Anda: *${code}*\n\nKode berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.`;
      waSent = await sendWa(waNumber, message).catch((err) => {
        console.error("[otp] Gagal kirim WA:", err);
        return false;
      });
    }

    // Fallback: kirim via email jika WA gagal atau tidak tersedia
    if (!waSent) {
      const emailAddr = existsReg?.email ?? existsUser?.email;
      if (emailAddr) {
        emailSent = await sendEmail({
          to: emailAddr,
          subject: "Kode Verifikasi Jetschool Academy",
          html: getOtpEmailHtml(code),
        }).then(() => true).catch((err) => {
          console.error("[otp] Gagal kirim email fallback:", err);
          return false;
        });
      }
    }
  }

  return {
    ok: true,
    channel: forceEmail ? "email" : (waSent ? "whatsapp" : emailSent ? "email" : "none"),
  };
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
