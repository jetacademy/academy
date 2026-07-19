import "dotenv/config";
import { sendEmail, getContactMessageEmailHtml } from "./src/lib/email";

async function main() {
  const to = process.env.SMTP_USER ?? "info@academy.jetschool.id";
  console.log("Mengirim email uji ke:", to);
  await sendEmail({
    to,
    subject: "[UJI] Pesan Baru dari Test User — Formulir Hubungi Kami",
    html: getContactMessageEmailHtml({
      name: "Test User (verifikasi Claude)",
      email: "test@example.com",
      whatsapp: "081234567890",
      message: "Ini pesan uji coba otomatis untuk memverifikasi form kontak yang baru diperbaiki. Aman diabaikan/dihapus.",
    }),
  });
  console.log("Selesai — cek log di atas utk konfirmasi sukses/gagal SMTP.");
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
