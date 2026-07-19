"use server";

import { headers } from "next/headers";
import { sendEmail, getContactMessageEmailHtml } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

const CONTACT_EMAIL_TO = process.env.SMTP_USER ?? "info@academy.jetschool.id";

export async function sendContactMessage(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().slice(0, 150);
  const whatsapp = String(formData.get("whatsapp") ?? "").trim().slice(0, 20);
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);

  if (!name || !whatsapp || !message) {
    return { error: "Nama, WhatsApp, dan pesan wajib diisi." };
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Format email tidak valid." };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "contact";
  const limit = checkRateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return { error: limit.error };
  }

  try {
    await sendEmail({
      to: CONTACT_EMAIL_TO,
      subject: `Pesan Baru dari ${name} — Formulir Hubungi Kami`,
      html: getContactMessageEmailHtml({ name, email, whatsapp, message }),
    });
    return { ok: true };
  } catch (err) {
    console.error("[sendContactMessage] Gagal mengirim email:", err);
    return { error: "Gagal mengirim pesan. Silakan coba lagi atau hubungi kami via WhatsApp." };
  }
}
