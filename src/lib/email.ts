import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

// Singleton transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const from = process.env.SMTP_FROM ?? "Jetschool Academy <no-reply@jetschool.id>";
  const client = getTransporter();

  if (client) {
    try {
      await client.sendMail({ from, to, subject, html });
      console.log(`[Email] Berhasil dikirim ke: ${to} (Subject: ${subject})`);
      return;
    } catch (err) {
      console.error("[Email] Gagal mengirim lewat SMTP:", err);
    }
  }

  // Fallback: hanya di development, log ke terminal
  if (process.env.NODE_ENV === "development") {
    const logDir = path.join(process.cwd(), "scratch");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, "emails.log");
    const logMessage = `
=========================================
TIMESTAMP: ${new Date().toISOString()}
KE       : ${to}
SUBJEK   : ${subject}
-----------------------------------------
${html.replace(/<[^>]*>/g, " ").trim()}
=========================================
`;

    fs.appendFileSync(logFile, logMessage, "utf-8");
    console.log(`\n[Email Simulation Dev] Ke: ${to}\nSubjek: ${subject}\nTeks tercatat di: scratch/emails.log\n`);
  } else {
    console.warn(`[Email] Gagal kirim ke ${to} — SMTP tidak tersedia.`);
  }

// ─── Templates ───────────────────────────────────────────────────

export function getWelcomeEmailHtml(name: string, programTitle: string, schedule: string, joinUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; color: #17161a; background: #ffffff;">
      <h2 style="color: #232176; margin-top: 0;">Halo ${name}, selamat bergabung! 👋</h2>
      <p>Pendaftaran Anda untuk program <strong>${programTitle}</strong> telah berhasil.</p>
      <div style="background: #f7f6f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;">📅 <strong>Jadwal Pelaksanaan:</strong> ${schedule}</p>
        <p style="margin: 0;">🔗 <strong>Tautan Penting:</strong> Gabung grup koordinasi WhatsApp untuk mendapatkan update terkini.</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${joinUrl}" style="background: #232176; color: #ffffff; padding: 12px 24px; border-radius: 99px; text-decoration: none; font-weight: bold; display: inline-block;">Gabung Grup WhatsApp Sekarang</a>
      </div>
      <p style="font-size: 0.9em; color: #56545c;">Jika tombol di atas tidak dapat diklik, salin tautan berikut ke browser Anda: <br/> <a href="${joinUrl}" style="color: #232176;">${joinUrl}</a></p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;"/>
      <p style="font-size: 0.8em; color: #9c99a3; text-align: center;">Jetschool Academy &copy; 2026. Semua hak dilindungi.</p>
    </div>
  `;
}

export function getPaidEmailHtml(name: string, programTitle: string, memberUrl: string, zoomLink?: string | null, waGroupLink?: string | null, lmsLink?: string | null) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; color: #17161a; background: #ffffff;">
      <h2 style="color: #232176; margin-top: 0;">Pembayaran Dikonfirmasi! 🎉</h2>
      <p>Halo ${name}, pembayaran Anda untuk program <strong>${programTitle}</strong> telah lunas. Akses penuh ke program Anda kini telah aktif.</p>
      
      <div style="background: #f7f6f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #232176; font-size: 1rem;">🔗 Detail Akses Pelatihan:</h3>
        ${zoomLink ? `<p style="margin: 0 0 8px 0;">📹 <strong>Link Zoom Live:</strong> <a href="${zoomLink}" style="color: #232176;">Gabung Zoom</a></p>` : ""}
        ${waGroupLink ? `<p style="margin: 0 0 8px 0;">💬 <strong>Link WhatsApp Group:</strong> <a href="${waGroupLink}" style="color: #232176;">Gabung Grup</a></p>` : ""}
        ${lmsLink ? `<p style="margin: 0 0 8px 0;">🖥️ <strong>Link Platform LMS:</strong> <a href="${lmsLink}" style="color: #232176;">Akses LMS</a></p>` : ""}
        <p style="margin: 0;">📝 <strong>Materi &amp; Tes:</strong> selesaikan pembelajaran di dashboard Anda — e-sertifikat terbit otomatis begitu syarat kelulusan terpenuhi.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${memberUrl}" style="background: #f7941d; color: #ffffff; padding: 12px 24px; border-radius: 99px; text-decoration: none; font-weight: bold; display: inline-block;">Buka Dashboard Belajar</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;"/>
      <p style="font-size: 0.8em; color: #9c99a3; text-align: center;">Jetschool Academy &copy; 2026. Semua hak dilindungi.</p>
    </div>
  `;
}

export function getCertEmailHtml(name: string, programTitle: string, certUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; color: #17161a; background: #ffffff;">
      <h2 style="color: #232176; margin-top: 0;">Selamat, Sertifikat Anda Telah Terbit! 🏆</h2>
      <p>Halo ${name}, selamat atas kelulusan Anda dalam program <strong>${programTitle}</strong>. E-sertifikat resmi Anda telah berhasil diterbitkan dan diverifikasi oleh sistem.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${certUrl}" style="background: #232176; color: #ffffff; padding: 14px 28px; border-radius: 99px; text-decoration: none; font-weight: bold; display: inline-block;">Unduh e-Sertifikat Resmi</a>
      </div>

      <p style="font-size: 0.9em; color: #56545c; text-align: center;">Sertifikat ini dilengkapi dengan QR Code verifikasi unik untuk pembuktian keabsahan publik.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;"/>
      <p style="font-size: 0.8em; color: #9c99a3; text-align: center;">Jetschool Academy &copy; 2026. Semua hak dilindungi.</p>
    </div>
  `;
}
